import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signOutUser,
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  getConversations,
  saveConversation,
  deleteConversation,
  getMessages,
  saveMessage,
  getInsights,
  saveInsight,
  deleteAllUserData,
  DEMO_USER,
  INITIAL_SAMPLE_ENTRIES
} from './lib/firebase';
import type {
  ActiveTab,
  ChatMessage,
  Conversation,
  JournalEntry,
  LongitudinalInsight,
  ToastNotification,
  UserProfile
} from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { LandingView } from './components/LandingView';
import { TodayView } from './components/TodayView';
import { JournalView } from './components/JournalView';
import { AIReflectionView } from './components/AIReflectionView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { SourceEntryModal } from './components/SourceEntryModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/Toast';
import { chatWithGemini } from './services/aiService';

export default function App() {
  // Authentication & Session
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('echora_theme') ||
      localStorage.getItem('chrona_theme') ||
      localStorage.getItem('reflectiq_theme')
    ) === 'dark';
  });

  // Data State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [insights, setInsights] = useState<LongitudinalInsight[]>([]);

  // Dialog & Modal State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [inspectedSourceEntry, setInspectedSourceEntry] = useState<JournalEntry | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);

  // Apply dark mode class to root document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('echora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('echora_theme', 'light');
    }
  }, [darkMode]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const savedDemo =
      localStorage.getItem('echora_is_demo') ||
      localStorage.getItem('chrona_is_demo') ||
      localStorage.getItem('reflectiq_is_demo');

    if (savedDemo === 'true') {
      setUser(DEMO_USER);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          isDemo: false
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load User Data upon login or switch
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setConversations([]);
      setMessages([]);
      setInsights([]);
      return;
    }

    const loadData = async () => {
      try {
        // Load journal entries
        const userEntries = await getJournalEntries(user.uid);
        if (userEntries.length === 0 && user.isDemo) {
          // Initialize demo samples
          for (const sample of INITIAL_SAMPLE_ENTRIES) {
            await saveJournalEntry(user.uid, sample);
          }
          const loadedSamples = await getJournalEntries(user.uid);
          setEntries(loadedSamples);
        } else {
          setEntries(userEntries);
        }

        // Load conversation threads
        const userConversations = await getConversations(user.uid);
        setConversations(userConversations);
        if (userConversations.length > 0) {
          setActiveConversation(userConversations[0]);
        }

        // Load insights
        const userInsights = await getInsights(user.uid);
        setInsights(userInsights);
      } catch (err: any) {
        console.error('Error initializing user data:', err);
        showToast('Could not load existing reflections.', 'error');
      }
    };

    loadData();
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!user || !activeConversation) {
      setMessages([]);
      return;
    }

    const loadConvoMessages = async () => {
      try {
        const msgs = await getMessages(user.uid, activeConversation.id);
        setMessages(msgs);
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    loadConvoMessages();
  }, [user, activeConversation]);

  // Entry operations
  const handleSaveEntry = async (entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    if (!user) throw new Error('Unauthenticated');
    const saved = await saveJournalEntry(user.uid, entryData);
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteJournalEntry(user.uid, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(null);
    }
  };

  // Conversation operations
  const handleCreateConversation = async (title?: string): Promise<Conversation> => {
    if (!user) throw new Error('Unauthenticated');
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      ownerUid: user.uid,
      title: title || 'New Reflection Session',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveConversation(user.uid, newConv);
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);
    setMessages([]);
    return newConv;
  };

  const handleDeleteConversation = async (id: string) => {
    if (!user) return;
    await deleteConversation(user.uid, id);
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConversation?.id === id) {
      setActiveConversation(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleSaveMessage = async (convId: string, msg: ChatMessage) => {
    if (!user) return;
    await saveMessage(user.uid, convId, msg);
    setMessages((prev) => [...prev, msg]);

    // Update conversation snippet and timestamp
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      const contentText = msg.content || '';
      const snippet = contentText.slice(0, 50) + (contentText.length > 50 ? '...' : '');
      const updatedConv: Conversation = {
        ...conv,
        updatedAt: Date.now(),
        lastMessageSnippet: snippet
      };
      await saveConversation(user.uid, updatedConv);
      setConversations((prev) => [updatedConv, ...prev.filter((c) => c.id !== convId)]);
    }
  };

  // Send message through server-side Gemini API proxy
  const handleSendMessage = async (text: string) => {
    if (!user) return;

    let conv = activeConversation;
    if (!conv) {
      conv = await handleCreateConversation(text.slice(0, 32) + '...');
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      conversationId: conv.id,
      role: 'user',
      content: text,
      createdAt: Date.now()
    };
    await handleSaveMessage(conv.id, userMsg);

    const updatedHistory = [...messages, userMsg];
    const apiMessages = updatedHistory.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      content: m.content
    }));

    const aiResult = await chatWithGemini({
      messages: apiMessages,
      journalEntries: entries
    });

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_a`,
      conversationId: conv.id,
      role: 'model',
      content: aiResult.text,
      createdAt: Date.now(),
      sources: aiResult.sources
    };
    await handleSaveMessage(conv.id, assistantMsg);
  };

  // Insight operations
  const handleSaveInsight = async (newInsight: LongitudinalInsight) => {
    if (!user) return;
    await saveInsight(user.uid, newInsight);
    setInsights((prev) => [newInsight, ...prev.filter((i) => i.id !== newInsight.id)]);
  };

  // Export JSON Archive
  const handleExportData = () => {
    if (!user) return;
    const payload = {
      product: 'ECHORA',
      exportedAt: new Date().toISOString(),
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email
      },
      journalEntries: entries,
      insights: insights
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echora_archive_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Journal archive downloaded.', 'success');
  };

  // Wipe all user data
  const handleDeleteAllData = async () => {
    if (!user) return;
    await deleteAllUserData(user.uid);
    setEntries([]);
    setSelectedEntry(null);
    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
    setInsights([]);
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    showToast('All personal journal and reflection records erased.', 'info');
  };

  // Auth Handlers
  const handleSignOut = async () => {
    localStorage.removeItem('echora_is_demo');
    localStorage.removeItem('chrona_is_demo');
    localStorage.removeItem('reflectiq_is_demo');
    await signOutUser();
    setUser(null);
    showToast('Signed out of ECHORA.', 'info');
  };

  const handleLaunchDemo = () => {
    localStorage.setItem('echora_is_demo', 'true');
    setUser(DEMO_USER);
    showToast('Entered Showcase Mode with private seed reflections.', 'success');
  };

  // Quick prompt from Today or Widgets
  const handleStartChatWithPrompt = (promptText: string) => {
    setChatInitialPrompt(promptText);
    setActiveTab('reflect');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#131211] text-stone-700 dark:text-stone-300">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-100 rounded-full animate-spin mx-auto" />
          <p className="font-editorial text-sm tracking-wide text-stone-500">
            Initializing ECHORA...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors
  if (!user) {
    return (
      <LandingView
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(`Welcome, ${loggedUser.displayName || 'friend'}.`, 'success');
        }}
        onLaunchDemo={handleLaunchDemo}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // Authenticated workspace
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF8F5] dark:bg-[#131211] text-stone-900 dark:text-stone-100 selection:bg-[#E4DFD5]">
      {/* Restrained Navigation Rail (Left on desktop, header on mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        entries={entries}
        onNewEntry={() => {
          setSelectedEntry(null);
          setActiveTab('journal');
        }}
        onSelectEntry={(entry) => {
          setSelectedEntry(entry);
          setActiveTab('journal');
        }}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Reading / Workspace Area */}
      <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {(activeTab === 'today' || activeTab === 'dashboard') && (
          <TodayView
            user={user}
            entries={entries}
            latestInsight={insights.length > 0 ? insights[0] : null}
            onNavigate={setActiveTab}
            onSelectEntry={(entry) => {
              setSelectedEntry(entry);
              setActiveTab('journal');
            }}
            onNewEntry={() => {
              setSelectedEntry(null);
              setActiveTab('journal');
            }}
            onStartChatWithPrompt={handleStartChatWithPrompt}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView
            entries={entries}
            selectedEntry={selectedEntry}
            onSelectEntry={setSelectedEntry}
            onSaveEntry={handleSaveEntry}
            onDeleteEntry={handleDeleteEntry}
            onShowToast={showToast}
            onRequestConfirm={(title, message, onConfirm) => {
              setConfirmModal({ isOpen: true, title, message, onConfirm });
            }}
          />
        )}

        {(activeTab === 'reflect' || activeTab === 'chat') && (
          <AIReflectionView
            user={user}
            conversations={conversations}
            activeConversation={activeConversation}
            messages={messages}
            entries={entries}
            onSelectConversation={setActiveConversation}
            onNewConversation={() => handleCreateConversation('Reflection Session')}
            onDeleteConversation={handleDeleteConversation}
            onSendMessage={handleSendMessage}
            onOpenSourceEntry={(entry) => setInspectedSourceEntry(entry)}
            onShowToast={showToast}
            initialPrompt={chatInitialPrompt}
            onClearInitialPrompt={() => setChatInitialPrompt(null)}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            user={user}
            entries={entries}
            insights={insights}
            onSaveInsight={handleSaveInsight}
            onShowToast={showToast}
            onOpenSourceEntry={(entry) => setInspectedSourceEntry(entry)}
            onStartReflectWithPrompt={handleStartChatWithPrompt}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            entries={entries}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onExportData={handleExportData}
            onDeleteAllData={handleDeleteAllData}
            onRequestConfirm={(title, message, onConfirm) => {
              setConfirmModal({ isOpen: true, title, message, onConfirm });
            }}
          />
        )}
      </main>

      {/* Interactive Citation Reader Modal */}
      <SourceEntryModal
        entry={inspectedSourceEntry}
        onClose={() => setInspectedSourceEntry(null)}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={true}
        confirmText="Confirm"
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
