/**
 * Sanitizes user objects by removing sensitive fields.
 */
export function sanitizeUser(user: any) {
  if (!user) return null;
  const { 
    passwordHash, 
    twoFactorSecret, 
    emailVerifyToken, 
    passwordResetToken, 
    passwordResetExpiry, 
    ...safe 
  } = user;
  return safe;
}

/**
 * Sanitizes node objects by masking the API key.
 */
export function sanitizeNode(node: any) {
  if (!node) return null;
  const { nodeApiKey, ...safe } = node;
  return {
    ...safe,
    nodeApiKey: nodeApiKey ? `${nodeApiKey.substring(0, 8)}...` : undefined
  };
}

/**
 * Sanitizes agent objects by removing sensitive fields like systemPrompt.
 */
export function sanitizeAgent(agent: any, requestUserId?: string) {
  if (!agent) return null;
  
  // If the requester is the owner, they can see everything
  if (requestUserId && agent.userId === requestUserId) {
    return agent;
  }

  const { 
    systemPrompt, 
    inputSchema, 
    outputSchema, 
    ...safe 
  } = agent;
  
  return safe;
}
