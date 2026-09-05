import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Trash2,
  BookOpen
} from 'lucide-react';
import type {
  ChatMessage,
  Conversation,
  JournalEntry,
  UserProfile
} from '../types';
import { sendChatMessage } from '../services/aiService';
import { splitOnCitations, parseCitations } from '../../shared/citations';

interface AIReflectionViewProps {
  user: UserProfile;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  entries: JournalEntry[];
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onSendMessage: (text: string) => Promise<void>;
  onOpenSourceEntry: (entry: JournalEntry) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const AIReflectionView: React.FC<AIReflectionViewProps> = ({
  user,
  conversations,
  activeConversation,
  messages,
  entries,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onSendMessage,
  onOpenSourceEntry,
  onShowToast,
  initialPrompt,
  onClearInitialPrompt
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle incoming initial prompt (from Today or Insights)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [initialPrompt, onClearInitialPrompt]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error('Failed to send reflection message:', err);
      const message = err instanceof Error && err.message
        ? err.message
        : 'Could not reach the reflection service. Please try again.';
      onShowToast(message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to find entry by ID or title match
  const findEntry = (id: string, title?: string): JournalEntry | undefined => {
    return (
      entries.find((e) => e.id === id) ||
      (title ? entries.find((e) => e.title?.toLowerCase() === title.toLowerCase()) : undefined)
    );
  };

  // Render formatted message text with inline parsed citations [[REF:id|title|date]],
  // using the shared parser so the format can never drift from the server's.
  const renderMessageContent = (content: string) => {
    if (!content) return '';
    return splitOnCitations(content).map((segment, idx) => {
      if (segment.type === 'text') return segment.value;
      const { id: refId, title: refTitle, date: refDate } = segment.value;
      return (
        <button
          key={`ref-${idx}`}
          type="button"
          onClick={() => {
            const entry = findEntry(refId, refTitle);
            if (entry) {
              onOpenSourceEntry(entry);
            } else {
              onShowToast(`Referenced entry "${refTitle}" not found in current view.`, 'info');
            }
          }}
          className="inline-flex items-baseline mx-1 px-1.5 py-0.5 rounded-sm bg-[#EFECE6] dark:bg-[#25221F] text-stone-900 dark:text-stone-100 hover:underline text-xs font-medium cursor-pointer transition-colors"
          title="Open source entry"
        >
          [ {refTitle} · {refDate} ]
        </button>
      );
    });
  };

  // Extract all citations from a message for the dedicated Sources footer
  const extractSources = (content: string) => parseCitations(content);

  // Starters
  const starterPrompts = [
    'What recurring themes have emerged in my recent writings?',
    'How has my perspective or mood shifted over the past few weeks?',
    'What goals or intentions have I committed to recently?'
  ];

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)]">
      {/* Editorial Header */}
      <div className="pb-4 mb-4 border-b border-[#E8E4DC] dark:border-[#2B2724] flex items-baseline justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
              Reflect
            </span>
            <span className="text-xs text-stone-600 dark:text-stone-400">·</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Grounded in {(entries || []).length} {(entries || []).length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <p className="font-editorial text-xl sm:text-2xl text-stone-900 dark:text-stone-100 font-medium mt-0.5">
            "Ask EchoraOS about your story."
          </p>
        </div>

        <button
          id="new-reflection-btn"
          onClick={onNewConversation}
          className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New reflection</span>
        </button>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2">
        {(!messages || messages.length === 0) ? (
          <div className="py-12 space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <p className="font-editorial text-2xl text-stone-800 dark:text-stone-200">
                Talk to your own history.
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-lg">
                Ask about what you've written, patterns over time, shifts in mood, or specific decisions you've weighed. EchoraOS cites exact entries from your archive.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
                Suggested inquiries
              </span>
              <div className="space-y-2">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left p-3 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817] text-sm text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-between group"
                  >
                    <span>"{prompt}"</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const sources = !isUser ? extractSources(msg.content) : [];

            return (
              <div
                key={msg.id}
                id={`reflection-msg-${msg.id}`}
                className={`space-y-3 ${isUser ? 'flex flex-col items-end' : 'space-y-3'}`}
              >
                {/* User Message */}
                {isUser ? (
                  <div className="bg-[#EFECE6] dark:bg-[#22201D] text-stone-900 dark:text-stone-100 rounded-2xl px-5 py-3 text-sm sm:text-base max-w-xl leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  /* EchoraOS Message: Quiet, editorial layout, no giant card box */
                  <div className="space-y-4 max-w-2xl">
                    <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
                      EchoraOS
                    </div>

                    <div className="text-base sm:text-[17px] text-stone-800 dark:text-stone-200 leading-relaxed font-normal whitespace-pre-wrap">
                      {renderMessageContent(msg.content)}
                    </div>

                    {/* Sources (typographic list, not clunky badges) */}
                    {sources.length > 0 && (
                      <div className="pt-3 border-t border-[#F0EDE6] dark:border-[#201E1C] space-y-1.5">
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
                          Sources
                        </span>
                        <div className="space-y-1">
                          {sources.map((s, idx) => {
                            const entry = findEntry(s.id, s.title);
                            return (
                              <div key={idx}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (entry) onOpenSourceEntry(entry);
                                    else onShowToast(`Entry "${s.title}" not found.`, 'info');
                                  }}
                                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
                                >
                                  <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                                    {s.date}
                                  </span>
                                  <span>—</span>
                                  <span className="underline underline-offset-2">
                                    "{s.title}"
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Follow-up suggestions */}
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleSend('Show me the pattern across these entries.')}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline underline-offset-4 transition-colors"
                      >
                        Show me the pattern
                      </button>
                      <span className="text-stone-300 dark:text-stone-700">·</span>
                      <button
                        onClick={() => handleSend('What has changed recently regarding this?')}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline underline-offset-4 transition-colors"
                      >
                        What changed recently?
                      </button>
                      <span className="text-stone-300 dark:text-stone-700">·</span>
                      <button
                        onClick={() => handleSend('What gentle question should I ask myself next?')}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline underline-offset-4 transition-colors"
                      >
                        Question to consider
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="space-y-2 max-w-2xl animate-pulse">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
              EchoraOS
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 italic">
              Reflecting on your journal entries...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Minimalist Input Bar */}
      <div className="pt-4 border-t border-[#E8E4DC] dark:border-[#2B2724] shrink-0">
        <div className="relative rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-[#FAF8F5] dark:bg-[#131211] focus-within:border-stone-400 dark:focus-within:border-stone-600 transition-colors">
          <textarea
            id="reflection-input"
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your thoughts, decisions, patterns, or moments..."
            className="w-full px-4 pt-3 pb-8 text-sm sm:text-base bg-transparent border-0 outline-none resize-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />

          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
            <span className="text-[10px] text-stone-600 dark:text-stone-400 hidden sm:inline">
              Return to send
            </span>
            <button
              id="send-reflection-btn"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isSending}
              className="p-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 disabled:opacity-30 hover:opacity-90 transition-opacity"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <span className="text-[11px] text-stone-600 dark:text-stone-400">
            EchoraOS reflects exclusively on your private entries. Raw thoughts are never exposed.
          </span>
        </div>
      </div>
    </div>
  );
};
