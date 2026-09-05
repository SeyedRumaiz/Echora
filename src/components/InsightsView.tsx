import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Calendar,
  Compass
} from 'lucide-react';
import type {
  JournalEntry,
  LongitudinalInsight,
  UserProfile,
  ActiveTab
} from '../types';
import { generateLongitudinalInsight } from '../services/aiService';

interface InsightsViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  isLoadingData?: boolean;
  insights: LongitudinalInsight[];
  onSaveInsight: (insight: LongitudinalInsight) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenSourceEntry: (entry: JournalEntry) => void;
  onStartReflectWithPrompt: (promptText: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

type Timeframe = '7days' | '14days' | '30days' | 'all';

export const InsightsView: React.FC<InsightsViewProps> = ({
  user,
  entries,
  isLoadingData = false,
  insights,
  onSaveInsight,
  onShowToast,
  onOpenSourceEntry,
  onStartReflectWithPrompt,
  onNavigate
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('30days');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter entries according to timeframe
  const filteredEntries = useMemo(() => {
    const list = Array.isArray(entries) ? entries : [];
    if (timeframe === 'all') return list;
    const days = timeframe === '7days' ? 7 : timeframe === '14days' ? 14 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return list.filter((e) => (e.createdAt || 0) >= cutoff);
  }, [entries, timeframe]);

  // Current insight
  const currentInsight = (Array.isArray(insights) && insights.length > 0) ? insights[0] : null;

  // Derive recurring themes from real data
  const derivedThemes = useMemo(() => {
    const themeCounts: { [key: string]: { count: number; sampleEntry: JournalEntry } } = {};

    (filteredEntries || []).forEach((entry) => {
      const allTokens = [
        ...(entry.tags || []),
        ...(entry.aiMetadata?.themes || [])
      ];

      allTokens.forEach((t) => {
        if (!t) return;
        const clean = t.trim().toLowerCase();
        if (clean.length > 2) {
          if (!themeCounts[clean]) {
            themeCounts[clean] = { count: 0, sampleEntry: entry };
          }
          themeCounts[clean].count += 1;
        }
      });
    });

    return Object.entries(themeCounts)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: data.count,
        sampleEntry: data.sampleEntry
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [filteredEntries]);

  // Extract real moments worth remembering from entries
  const momentsWorthRemembering = useMemo(() => {
    return (filteredEntries || [])
      .filter((e) => e && e.title && (e.aiMetadata?.takeaway || (e.content && e.content.length > 100)))
      .slice(0, 3);
  }, [filteredEntries]);

  // Generate insight action
  const handleGenerateInsight = async () => {
    if (!filteredEntries || filteredEntries.length === 0) {
      onShowToast('Record at least one journal entry in this timeframe first.', 'info');
      return;
    }

    setIsGenerating(true);
    try {
      const days = timeframe === '7days' ? 7 : timeframe === '14days' ? 14 : 30;
      const res = await generateLongitudinalInsight(filteredEntries, days);
      await onSaveInsight(res);
      onShowToast('Synthesis updated.', 'success');
    } catch (err) {
      console.error('Insight generation error:', err);
      onShowToast('Could not synthesize insight.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl sm:max-w-3xl mx-auto py-6 sm:py-10 space-y-12 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E8E4DC] dark:border-[#2B2724]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            Insights
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Your story over time.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
          {(
            [
              { id: '7days', label: '7 Days' },
              { id: '14days', label: '14 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'all', label: 'All Time' }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeframe(item.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeframe === item.id
                  ? 'bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 font-semibold'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoadingData && entries.length === 0 ? (
        <div className="space-y-4 py-6" aria-hidden="true">
          <div className="echora-skeleton h-7 w-2/3" />
          <div className="echora-skeleton h-4 w-full" />
          <div className="echora-skeleton h-4 w-5/6" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="font-editorial text-2xl text-stone-800 dark:text-stone-200">
            Your patterns will appear here as you write.
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            As you record entries, EchoraOS synthesizes recurring themes, milestones, and intentions over time.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('journal')}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
            >
              Start your first entry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Executive Synthesis / Observation */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
                Synthesis
              </span>
              <button
                id="synthesize-insights-btn"
                onClick={handleGenerateInsight}
                disabled={isGenerating}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Synthesizing...' : 'Synthesize reflection'}</span>
              </button>
            </div>

            {currentInsight ? (
              <div className="space-y-3">
                <p className="font-editorial text-xl sm:text-2xl text-stone-900 dark:text-stone-100 leading-relaxed italic">
                  "{currentInsight.summary}"
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() =>
                      onStartReflectWithPrompt(
                        `Tell me more about the overarching pattern identified in my insights: "${currentInsight.summary}"`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-900 dark:text-stone-100 hover:opacity-75 transition-opacity"
                  >
                    <span>Explore this synthesis in Reflect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {currentInsight.moodTrendObservation && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic pt-1">
                    {currentInsight.moodTrendObservation}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-editorial text-lg text-stone-800 dark:text-stone-200">
                  Ready to synthesize observations across {filteredEntries.length} entries.
                </p>
                <button
                  onClick={handleGenerateInsight}
                  disabled={isGenerating}
                  className="text-xs font-medium text-stone-900 dark:text-stone-100 underline underline-offset-4"
                >
                  Generate synthesis →
                </button>
              </div>
            )}
          </section>

          <hr className="border-t border-[#E8E4DC] dark:border-[#2B2724]" />

          {/* RECURRING THREADS */}
          <section className="space-y-4">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
              Recurring Threads
            </span>

            {derivedThemes.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Continue journaling to reveal recurring topics and patterns over time.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {derivedThemes.map((theme) => (
                  <div
                    key={theme.name}
                    className="p-4 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817] transition-colors space-y-2 group"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-editorial text-lg font-medium text-stone-900 dark:text-stone-100">
                        {theme.name}
                      </h3>
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                        {theme.count} {theme.count === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      Mentioned in "{theme.sampleEntry.title || 'Untitled'}" and related writings.
                    </p>

                    <button
                      onClick={() =>
                        onStartReflectWithPrompt(
                          `What have I written about ${theme.name} across my journal entries?`
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-stone-900 dark:text-stone-100 pt-1 group-hover:underline"
                    >
                      <span>Explore thread</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-t border-[#E8E4DC] dark:border-[#2B2724]" />

          {/* MOMENTS WORTH REMEMBERING */}
          <section className="space-y-4">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
              Moments Worth Remembering
            </span>

            {momentsWorthRemembering.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Key narrative breakthroughs and milestones will be highlighted here.
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-[#F0EDE6] dark:divide-[#201E1C]">
                {momentsWorthRemembering.map((entry) => {
                  const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={entry.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenSourceEntry(entry)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenSourceEntry(entry);
                        }
                      }}
                      className="pt-4 first:pt-0 group cursor-pointer space-y-1 rounded-md"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-editorial text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                          "{entry.title || 'Untitled Entry'}"
                        </h3>
                        <span className="text-xs text-stone-600 dark:text-stone-400 font-mono shrink-0">
                          {dateStr}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {entry.aiMetadata?.takeaway || entry.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <hr className="border-t border-[#E8E4DC] dark:border-[#2B2724]" />

          {/* QUESTIONS TO CARRY FORWARD */}
          <section className="space-y-4">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
              Questions to Carry Forward
            </span>

            <div className="space-y-3">
              {((currentInsight?.recommendations && Array.isArray(currentInsight.recommendations) && currentInsight.recommendations.length > 0)
                ? currentInsight.recommendations
                : (currentInsight?.reflectionQuestions && Array.isArray(currentInsight.reflectionQuestions) && currentInsight.reflectionQuestions.length > 0)
                ? currentInsight.reflectionQuestions
                : [
                    'What has been consuming your emotional energy without giving much back?',
                    'Are there decisions you are delaying because of the uncertainty involved?',
                    'What would a gentle, unhurried week look like for you?'
                  ]
              ).map((q, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => onStartReflectWithPrompt(q)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onStartReflectWithPrompt(q);
                    }
                  }}
                  className="p-3.5 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <p className="font-editorial text-base text-stone-800 dark:text-stone-200">
                    "{q}"
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors shrink-0 ml-3" />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
