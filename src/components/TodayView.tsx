import React, { useState } from 'react';
import {
  ArrowRight,
  PenLine,
  Compass,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import type { JournalEntry, LongitudinalInsight, UserProfile, ActiveTab } from '../types';

interface TodayViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  latestInsight: LongitudinalInsight | null;
  onNavigate: (tab: ActiveTab) => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onStartChatWithPrompt: (promptText: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  user,
  entries,
  latestInsight,
  onNavigate,
  onSelectEntry,
  onNewEntry,
  onStartChatWithPrompt
}) => {
  const [quickThought, setQuickThought] = useState('');

  // Date formatting
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Time-aware greeting
  const hour = today.getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.displayName || user.email || 'Friend').split(' ')[0];

  // Derive recent entries
  const safeEntries = Array.isArray(entries) ? entries : [];
  const recentEntries = safeEntries.slice(0, 3);

  // Dynamic thread worth exploring
  let threadObservation = "You've returned to questions about your pacing and commitments in recent entries.";
  let threadPrompt = "What have I been struggling with regarding my pacing and commitments recently?";

  if (latestInsight?.summary) {
    threadObservation = latestInsight.summary;
    threadPrompt = `Tell me more about the pattern observed: "${latestInsight.summary}"`;
  } else if (safeEntries.length > 0 && safeEntries[0]?.aiMetadata?.takeaway) {
    threadObservation = safeEntries[0].aiMetadata.takeaway;
    threadPrompt = `In my recent entry "${safeEntries[0].title || 'Untitled'}", you observed: "${safeEntries[0].aiMetadata.takeaway}". Can we explore this deeper?`;
  }

  // Reflection prompt of the day
  const reflectionPrompt = "What would you tell yourself from a month ago?";

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-12 animate-in fade-in duration-300">
      {/* Top Identity & Date */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-stone-400">
          <span>ECHORA</span>
          <span>·</span>
          <span>{dateFormatted}</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-light text-stone-600 dark:text-stone-400">
            {timeGreeting}, {firstName}.
          </h1>
          <p className="font-editorial text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 font-normal leading-tight">
            "What has been on your mind?"
          </p>
        </div>

        {/* Start writing CTA */}
        <div className="pt-2 flex items-center gap-3">
          <button
            id="today-start-writing-btn"
            onClick={onNewEntry}
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs"
          >
            <PenLine className="w-4 h-4" />
            <span>Start writing</span>
          </button>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-t border-[#E8E4DC] dark:border-[#2B2724]" />

      {/* RECENTLY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
            Recently
          </h2>
          {safeEntries.length > 0 && (
            <button
              onClick={() => onNavigate('journal')}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
              All entries ({safeEntries.length})
            </button>
          )}
        </div>

        {safeEntries.length === 0 ? (
          <div className="py-6 space-y-2">
            <p className="font-editorial text-xl text-stone-800 dark:text-stone-200">
              Your story starts here.
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-lg">
              Write something today. ECHORA will help you understand the threads that emerge over time.
            </p>
            <div className="pt-3">
              <button
                onClick={onNewEntry}
                className="text-sm font-medium text-stone-900 dark:text-stone-100 underline underline-offset-4 hover:opacity-80"
              >
                Write your first entry →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-[#F0EDE6] dark:divide-[#201E1C]">
            {recentEntries.map((entry) => {
              const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              return (
                <div
                  key={entry.id}
                  id={`today-recent-entry-${entry.id}`}
                  onClick={() => onSelectEntry(entry)}
                  className="pt-4 first:pt-0 group cursor-pointer"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-editorial text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    <span className="text-xs text-stone-400 shrink-0 font-mono">
                      {dateStr}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Divider */}
      <hr className="border-t border-[#E8E4DC] dark:border-[#2B2724]" />

      {/* A THREAD WORTH EXPLORING */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
          A Thread Worth Exploring
        </h2>

        {safeEntries.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            As you write, ECHORA observes recurring thoughts, questions, and patterns across your entries.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="font-editorial text-lg sm:text-xl text-stone-800 dark:text-stone-200 italic leading-relaxed">
              "{threadObservation}"
            </p>
            <div>
              <button
                id="today-explore-thread-btn"
                onClick={() => onStartChatWithPrompt(threadPrompt)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 dark:text-stone-100 hover:opacity-75 transition-opacity"
              >
                <span>Explore the thread</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Divider */}
      <hr className="border-t border-[#E8E4DC] dark:border-[#2B2724]" />

      {/* REFLECTION PROMPT */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
          Reflection Prompt
        </h2>
        <p className="font-editorial text-lg sm:text-xl text-stone-900 dark:text-stone-100 leading-relaxed">
          "{reflectionPrompt}"
        </p>
        <div>
          <button
            id="today-reflect-prompt-btn"
            onClick={() => onStartChatWithPrompt(reflectionPrompt)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 dark:text-stone-100 hover:opacity-75 transition-opacity"
          >
            <span>Reflect on this</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
