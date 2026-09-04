export type MoodType =
  | 'Joyful'
  | 'Peaceful'
  | 'Reflective'
  | 'Motivated'
  | 'Anxious'
  | 'Fatigued'
  | 'Neutral';

export interface AIMetadata {
  takeaway?: string;
  reflectionQuestions?: string[];
  themes?: string[];
  suggestedTags?: string[];
}

export interface JournalEntry {
  id: string;
  ownerUid: string;
  title: string;
  content: string;
  mood?: MoodType;
  tags: string[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  aiMetadata?: AIMetadata;
}

export interface SourceCitation {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: number;
  sources?: SourceCitation[];
}

export interface Conversation {
  id: string;
  ownerUid: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessageSnippet?: string;
}

export interface MeaningfulMoment {
  title: string;
  description: string;
  date?: string;
  entryId?: string;
}

export interface LongitudinalInsight {
  id: string;
  ownerUid: string;
  timeframe: string;
  summary: string;
  themes: string[];
  meaningfulMoments: MeaningfulMoment[];
  goalsAndIntentions: string[];
  challenges: string[];
  reflectionQuestions: string[];
  suggestedNextSteps: string[];
  moodTrendObservation: string;
  createdAt: number;
}

export interface SingleEntryAnalysis {
  takeaway: string;
  reflectionQuestions: string[];
  themes: string[];
  suggestedTags: string[];
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export type ActiveTab = 'today' | 'journal' | 'reflect' | 'insights' | 'settings' | 'dashboard' | 'chat';
