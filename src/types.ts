export type Conversation = {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  updatedAt: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  thought?: string | null;
};

export type Scheme = {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  hindiDescription: string;
  eligibility: string[];
  benefits: string[];
  documents: string[];
  category: 'Education' | 'Agriculture' | 'Health' | 'Social' | 'Finance';
  officialUrl?: string;
  state?: string;
  image?: string;
  confidenceScore?: number;
  officialSource?: string;
  mitraId: string;
  aiVersion?: string;
};

export type UserProfile = {
  name?: string;
  state?: string;
  needs?: string;
  preferredLanguage: 'en' | 'hi' | 'hinglish';
  isPremium: boolean;
};

export type TrackerApplication = {
  id: string;
  schemeName: string;
  applicationId: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  updatedAt: number;
  notes?: string;
};
