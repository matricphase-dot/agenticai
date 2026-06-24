import { pipeline } from '@xenova/transformers';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

// Embedding model - runs locally, no API key needed
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    logger.info('Loading embedding model...');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    logger.info('Embedding model loaded');
  }
  return embedder;
}

// Generate embeddings for text
async function generateEmbedding(text: string): Promise<number[]> {
  const embed = await getEmbedder();
  const output = await embed(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data);
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Split text into chunks
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) chunks.push(chunk);
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
}

// Extract text from different file types
async function extractText(
  filePath: string,
  fileType: string
): Promise<string> {
  if (fileType === 'application/pdf' || filePath.endsWith('.pdf')) {
    const buffer = fs.readFileSync(filePath);
    const data = await (pdfParse as any)(buffer);
    return data.text;
  }
  
  if (fileType.includes('word') || filePath.endsWith('.docx')) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  if (fileType === 'text/plain' || filePath.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  
  if (fileType === 'text/markdown' || filePath.endsWith('.md')) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
}

export const RAGService = {

  // Process uploaded document
  async processDocument(
    knowledgeBaseId: string,
    documentId: string,
    filePath: string,
    fileType: string
  ): Promise<void> {
    try {
      logger.info('Processing document for RAG', { documentId });
      
      // Extract text
      const text = await extractText(filePath, fileType);
      
      // Chunk the text
      const chunks = chunkText(text);
      
      logger.info(`Processing ${chunks.length} chunks`, { documentId });
      
      // Generate embeddings and save chunks
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        
        await prisma.vectorChunk.create({
          data: {
            knowledgeBaseId,
            documentId,
            content: chunks[i],
            embedding,
            chunkIndex: i,
            metadata: {
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          },
        });
      }
      
      // Update document status
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: 'ready', chunkCount: chunks.length },
      });
      
      // Update knowledge base
      const totalChunks = await prisma.vectorChunk.count({
        where: { knowledgeBaseId },
      });
      
      await prisma.knowledgeBase.update({
        where: { id: knowledgeBaseId },
        data: { status: 'ready', totalChunks },
      });
      
      // Cleanup temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      logger.info('Document processed successfully', { documentId, chunks: chunks.length });
    } catch (error) {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: 'failed' },
      });
      logger.error('Document processing failed', { documentId, error });
      throw error;
    }
  },

  // Search knowledge base for relevant chunks
  async search(
    knowledgeBaseId: string,
    query: string,
    topK = 5
  ): Promise<string[]> {
    try {
      const queryEmbedding = await generateEmbedding(query);
      
      // Get all chunks for this knowledge base
      const chunks = await prisma.vectorChunk.findMany({
        where: { knowledgeBaseId },
        select: { content: true, embedding: true },
      });
      
      if (chunks.length === 0) return [];
      
      // Calculate similarity scores
      const scored = chunks.map(chunk => ({
        content: chunk.content,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }));
      
      // Sort by score and take top K
      scored.sort((a, b) => b.score - a.score);
      
      return scored
        .slice(0, topK)
        .filter(c => c.score > 0.3)
        .map(c => c.content);
    } catch (error) {
      logger.error('RAG search failed', { knowledgeBaseId, error });
      return [];
    }
  },

  // Build RAG context for agent
  async buildContext(
    agentId: string,
    query: string
  ): Promise<string> {
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: { agentId, status: 'ready' },
      select: { id: true, name: true },
    });
    
    if (knowledgeBases.length === 0) return '';
    
    const allResults: string[] = [];
    
    for (const kb of knowledgeBases) {
      const results = await RAGService.search(kb.id, query);
      allResults.push(...results);
    }
    
    if (allResults.length === 0) return '';
    
    return `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${allResults
      .slice(0, 5)
      .map((r, i) => `[${i + 1}] ${r}`)
      .join('\n\n')}\n\nUse the above context to answer the user's question when relevant.`;
  },
};
