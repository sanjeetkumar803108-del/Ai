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
  aadharNumber?: string;
  aadharDocUrl?: string;
  phoneNumber?: string;
  address?: string;
  class?: string;
  stream?: 'PCB' | 'PCM' | 'Commerce' | 'Arts' | 'Others';
  needs?: string;
  preferredLanguage: 'en' | 'hi' | 'hinglish';
  isPremium: boolean;
  streak: number;
  lastLogin?: number;
  notificationsEnabled?: boolean;
  whatsappNumber?: string;
  occupation?: 'Farmer' | 'Student' | 'Worker' | 'Unemployed' | 'Other';
  hasCompletedTutorial?: boolean;
  savedSchemeIds?: string[];
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: 'deadline' | 'status' | 'news';
  timestamp: number;
  read: boolean;
  actionUrl?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  audioUrl?: string;
  timestamp: number;
  category: 'Scholarship' | 'Exam' | 'Scheme';
};

export type Quiz = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type TrackerApplication = {
  id: string;
  schemeName: string;
  applicationId: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  updatedAt: number;
  notes?: string;
};

export type UserDocument = {
  id: string;
  userId: string;
  name: string;
  type: string;
  url: string;
  expiryDate?: number;
  uploadedAt: number;
};

export type UserFeedback = {
  id: string;
  userId: string;
  userEmail: string;
  type: 'issue' | 'suggestion' | 'general';
  content: string;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'resolved';
};

export type FormDraft = {
  id: string;
  userId: string;
  formName: string;
  formData: Record<string, string>;
  formDefinition: any;
  updatedAt: number;
};
