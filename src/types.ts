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
};

export type UserProfile = {
  name?: string;
  state?: string;
  preferredLanguage: 'en' | 'hi' | 'hinglish';
  isPremium: boolean;
};
