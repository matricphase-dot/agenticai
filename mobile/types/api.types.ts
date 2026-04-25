/* Shared API Types Mirroring Backend Schema */

export enum ProposalType { 
  FEE_CHANGE = 'FEE_CHANGE', 
  TREASURY = 'TREASURY', 
  FEATURE = 'FEATURE', 
  SLASH = 'SLASH', 
  OTHER = 'OTHER' 
}

export enum VoteChoice { 
  FOR = 'FOR', 
  AGAINST = 'AGAINST', 
  ABSTAIN = 'ABSTAIN' 
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  creator?: User;
  rating?: number;
}

export interface StakePosition {
  id: string;
  agent: Agent;
  amount: number;
  stakedAt: string;
  lockPeriod: number;
}

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  proposalType: ProposalType;
  startBlock: number;
  endBlock: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  executed: boolean;
  cancelled: boolean;
}
