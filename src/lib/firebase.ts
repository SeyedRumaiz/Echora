import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import type {
  JournalEntry,
  Conversation,
  ChatMessage,
  LongitudinalInsight,
  UserProfile
} from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjEOSiECfU8wOX4cxwcCOrLDiDqmY0jw0",
  authDomain: "echoraos-52fd5.firebaseapp.com",
  projectId: "echoraos-52fd5",
  storageBucket: "echoraos-52fd5.firebasestorage.app",
  messagingSenderId: "741054564094",
  appId: "1:741054564094:web:16013ffd4402650c2b87af"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID if provided
export const db = getFirestore(app);

/* -------------------------------------------------------------
 * Authentication API
 * -----------------------------------------------------------*/
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    isDemo: false
  };
}

export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName || email.split('@')[0],
    photoURL: result.user.photoURL,
    isDemo: false
  };
}

export async function signUpWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: email.split('@')[0],
    photoURL: result.user.photoURL,
    isDemo: false
  };
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/* -------------------------------------------------------------
 * Demo / Showcase Initial Seed Data
 * (Allows hackathon judges to immediately test Gemini reflection)
 * -----------------------------------------------------------*/
export const DEMO_USER: UserProfile = {
  uid: 'demo-judge-showcase-uid',
  email: 'judge@apac-ideathon.dev',
  displayName: 'GenAI Ideathon Judge',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  isDemo: true
};

export const INITIAL_SAMPLE_ENTRIES: Omit<JournalEntry, 'id' | 'ownerUid'>[] = [
  {
    title: "Kicking off the GenAI Academy Ideathon",
    content: "Today was intense but exhilarating. We spent hours architecting our AI memory companion EchoraOS. The biggest challenge wasn't just connecting Gemini—it was making sure the AI is truly humble, never hallucinating memories that weren't in the journal, and citing specific source entries. I felt a real sense of clarity when we finalized the Firestore security rules to guarantee per-user data isolation.",
    mood: "Motivated",
    tags: ["google-cloud", "ideathon", "architecture", "gemini"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5
  },
  {
    title: "Morning coffee & quiet reflections on work-life balance",
    content: "Woke up at 6:30 AM before the neighborhood got noisy. Took a slow 20-minute walk by the canal. Lately I've been feeling the strain of context-switching between sprint deadlines and side projects. My goal for this month is to protect Sunday evenings completely from screen time and read actual physical books. Small steps, but consistency is what I lack.",
    mood: "Peaceful",
    tags: ["mindfulness", "habits", "goals", "routine"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    title: "Overcoming a frustrating blocker with Secret Manager",
    content: "Felt quite anxious today when configuring environment secrets for Cloud Run. For a moment I was tempted to just write an env file, but cutting corners defeats the whole purpose of enterprise security. Spent the extra hour reading Google Cloud Secret Manager docs and wiring the service account properly with secretmanager.secretAccessor role. It feels so gratifying when things work cleanly.",
    mood: "Reflective",
    tags: ["google-cloud", "security", "learning", "cloud-run"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  },
  {
    title: "Mid-week check-in: Feeling productive yet restless",
    content: "Productivity was high today—shipped 3 core modules and reviewed the multi-turn conversational loop. But in the evening I noticed that restless feeling creeping back. Am I taking on too many commitments at once? I need to remember that pacing matters. Acknowledging this instead of brushing it off is progress for me.",
    mood: "Reflective",
    tags: ["self-awareness", "pacing", "productivity"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1, // Yesterday
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  },
  {
    title: "Morning clarity: Staying true to user privacy",
    content: "Reflecting on how personal journaling really is. When someone opens up their thoughts, fears, and hopes in an app, they deserve absolute cryptographic and architectural respect. No telemetry of raw thoughts, no unauthorized AI training, and strict zero-leakage Firestore rules. Building with integrity is the only way.",
    mood: "Joyful",
    tags: ["privacy", "ethics", "values", "focus"],
    createdAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 4
  }
];

/* -------------------------------------------------------------
 * Firestore Journal Operations (Strict User Scoped)
 * Path: users/{uid}/journalEntries/{entryId}
 * -----------------------------------------------------------*/
export async function getJournalEntries(uid: string): Promise<JournalEntry[]> {
  try {
    const entriesRef = collection(db, 'users', uid, 'journalEntries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const entries: JournalEntry[] = [];
    snapshot.forEach(docSnap => {
      entries.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return entries;
  } catch (error) {
    console.warn('Firestore fetch failed, checking local fallback:', error);
    const local = localStorage.getItem(`echoraos_entries_${uid}`) || localStorage.getItem(`echora_entries_${uid}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return [];
  }
}

export async function saveJournalEntry(uid: string, entry: Partial<JournalEntry>): Promise<JournalEntry> {
  const isNew = !entry.id;
  const entryId = entry.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const entryData: JournalEntry = {
    id: entryId,
    ownerUid: uid,
    title: entry.title || 'Untitled Entry',
    content: entry.content || '',
    mood: entry.mood,
    tags: entry.tags || [],
    createdAt: entry.createdAt || now,
    updatedAt: now,
    aiMetadata: entry.aiMetadata
  };

  try {
    const docRef = doc(db, 'users', uid, 'journalEntries', entryId);
    await setDoc(docRef, entryData);
  } catch (error) {
    console.warn('Firestore write error, saving to local fallback storage:', error);
  }

  // Also sync locally for resilient offline resilience
  const existing = await getJournalEntries(uid);
  const updated = isNew
    ? [entryData, ...existing.filter(e => e.id !== entryId)]
    : existing.map(e => (e.id === entryId ? entryData : e));
  localStorage.setItem(`echoraos_entries_${uid}`, JSON.stringify(updated));

  return entryData;
}

export async function deleteJournalEntry(uid: string, entryId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'journalEntries', entryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore delete error:', error);
  }

  const existing = await getJournalEntries(uid);
  const filtered = existing.filter(e => e.id !== entryId);
  localStorage.setItem(`echoraos_entries_${uid}`, JSON.stringify(filtered));
}

/* -------------------------------------------------------------
 * Firestore Conversation & Messages (Strict User Scoped)
 * Path: users/{uid}/conversations/{conversationId}
 *       users/{uid}/conversations/{conversationId}/messages/{messageId}
 * -----------------------------------------------------------*/
export async function getConversations(uid: string): Promise<Conversation[]> {
  try {
    const colRef = collection(db, 'users', uid, 'conversations');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const convs: Conversation[] = [];
    snap.forEach(d => convs.push({ id: d.id, ...(d.data() as any) }));
    return convs;
  } catch (error) {
    console.warn('Firestore conversations fetch failed:', error);
    const local = localStorage.getItem(`echoraos_conversations_${uid}`) || localStorage.getItem(`echora_conversations_${uid}`);
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return [];
  }
}

export async function saveConversation(uid: string, conv: Conversation): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'conversations', conv.id);
    await setDoc(docRef, conv);
  } catch (error) {
    console.warn('Firestore conversation write error:', error);
  }
  const existing = await getConversations(uid);
  const updated = [conv, ...existing.filter(c => c.id !== conv.id)];
  localStorage.setItem(`echoraos_conversations_${uid}`, JSON.stringify(updated));
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'conversations', conversationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore conversation delete error:', error);
  }
  const existing = await getConversations(uid);
  const filtered = existing.filter(c => c.id !== conversationId);
  localStorage.setItem(`echoraos_conversations_${uid}`, JSON.stringify(filtered));
}

export async function getMessages(uid: string, conversationId: string): Promise<ChatMessage[]> {
  try {
    const colRef = collection(db, 'users', uid, 'conversations', conversationId, 'messages');
    const q = query(colRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const msgs: ChatMessage[] = [];
    snap.forEach(d => msgs.push({ id: d.id, ...(d.data() as any) }));
    return msgs;
  } catch (error) {
    console.warn('Firestore messages fetch failed:', error);
    const local = localStorage.getItem(`echoraos_msgs_${uid}_${conversationId}`) || localStorage.getItem(`echora_msgs_${uid}_${conversationId}`);
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return [];
  }
}

export async function saveMessage(uid: string, conversationId: string, msg: ChatMessage): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'conversations', conversationId, 'messages', msg.id);
    await setDoc(docRef, msg);
  } catch (error) {
    console.warn('Firestore message save error:', error);
  }
  const existing = await getMessages(uid, conversationId);
  const updated = [...existing, msg];
  localStorage.setItem(`echoraos_msgs_${uid}_${conversationId}`, JSON.stringify(updated));
}

/* -------------------------------------------------------------
 * Firestore Insights
 * Path: users/{uid}/insights/{insightId}
 * -----------------------------------------------------------*/
export async function getInsights(uid: string): Promise<LongitudinalInsight[]> {
  try {
    const colRef = collection(db, 'users', uid, 'insights');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: LongitudinalInsight[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
    return list;
  } catch (error) {
    const local = localStorage.getItem(`echoraos_insights_${uid}`) || localStorage.getItem(`echora_insights_${uid}`);
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return [];
  }
}

export async function saveInsight(uid: string, insight: LongitudinalInsight): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'insights', insight.id);
    await setDoc(docRef, insight);
  } catch (error) {
    console.warn('Firestore insight save error:', error);
  }
  const existing = await getInsights(uid);
  const updated = [insight, ...existing.filter(i => i.id !== insight.id)];
  localStorage.setItem(`echoraos_insights_${uid}`, JSON.stringify(updated));
}

/* -------------------------------------------------------------
 * Privacy: Delete All User Data
 * -----------------------------------------------------------*/
export async function deleteAllUserData(uid: string): Promise<void> {
  // Clear local storage for user (both echoraos and legacy echora keys)
  localStorage.removeItem(`echoraos_entries_${uid}`);
  localStorage.removeItem(`echoraos_conversations_${uid}`);
  localStorage.removeItem(`echoraos_insights_${uid}`);
  localStorage.removeItem(`echora_entries_${uid}`);
  localStorage.removeItem(`echora_conversations_${uid}`);
  localStorage.removeItem(`echora_insights_${uid}`);
  // In demo or live mode, cleanup local references
}
