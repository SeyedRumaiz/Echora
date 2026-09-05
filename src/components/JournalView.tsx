import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Sparkles,
  Smile,
  X,
  Clock
} from 'lucide-react';
import type { JournalEntry, MoodType, SingleEntryAnalysis } from '../types';
import { analyzeSingleEntry } from '../services/aiService';

interface JournalViewProps {
  entries: JournalEntry[];
  isLoadingData?: boolean;
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  onSaveEntry: (entryData: Partial<JournalEntry>) => Promise<JournalEntry>;
  onDeleteEntry: (id: string) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestConfirm: (title: string, msg: string, onConfirm: () => void) => void;
  onStartReflectWithEntry?: (entry: JournalEntry) => void;
}

const ALL_MOODS: MoodType[] = [
  'Reflective',
  'Peaceful',
  'Joyful',
  'Motivated',
  'Anxious',
  'Fatigued',
  'Neutral'
];

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  isLoadingData = false,
  selectedEntry,
  onSelectEntry,
  onSaveEntry,
  onDeleteEntry,
  onShowToast,
  onRequestConfirm,
  onStartReflectWithEntry
}) => {
  // Mode: Timeline or Writing
  const isEditing = selectedEntry !== null;

  // Editor form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SingleEntryAnalysis | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Sync state when selected entry changes
  useEffect(() => {
    if (selectedEntry) {
      setTitle(selectedEntry.title || '');
      setContent(selectedEntry.content || '');
      setMood(selectedEntry.mood);
      setTags(selectedEntry.tags || []);
      setAnalysis(selectedEntry.aiMetadata ? {
        takeaway: selectedEntry.aiMetadata.takeaway || '',
        reflectionQuestions: selectedEntry.aiMetadata.reflectionQuestions || [],
        themes: selectedEntry.aiMetadata.themes || [],
        suggestedTags: selectedEntry.aiMetadata.suggestedTags || []
      } : null);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    } else {
      setTitle('');
      setContent('');
      setMood(undefined);
      setTags([]);
      setAnalysis(null);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    }
  }, [selectedEntry]);

  // Handle content changes
  const handleContentChange = (val: string) => {
    setContent(val);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setHasUnsavedChanges(true);
        setSaveStatus('unsaved');
      }
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  // Save entry. `silent` is used by autosave so it never interrupts typing with
  // a toast or an error about an empty draft -- only an explicit Save (button or
  // Cmd+S) talks to the user.
  const performSave = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!title.trim() && !content.trim()) {
      if (!silent) {
        onShowToast('Enter a title or thoughts before saving.', 'info');
      }
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const saved = await onSaveEntry({
        id: selectedEntry?.id,
        title: title.trim() || 'Untitled Entry',
        content,
        mood,
        tags,
        createdAt: selectedEntry?.createdAt,
        aiMetadata: analysis ? {
          takeaway: analysis.takeaway,
          reflectionQuestions: analysis.reflectionQuestions,
          themes: analysis.themes,
          suggestedTags: analysis.suggestedTags
        } : selectedEntry?.aiMetadata
      });
      onSelectEntry(saved);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      if (!silent) {
        onShowToast('Journal entry saved.', 'success');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveStatus('unsaved');
      if (!silent) {
        onShowToast('Failed to save entry. Please try again.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => performSave({ silent: false });

  // Cmd+S / Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape' && isEditing) {
        if (!hasUnsavedChanges) {
          onSelectEntry(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, mood, tags, analysis, hasUnsavedChanges, isEditing]);

  // Debounced autosave: once writing pauses for a couple seconds, quietly persist
  // the draft so a closed tab or a lost connection never loses real writing.
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return;
    if (!title.trim() && !content.trim()) return;

    const timer = setTimeout(() => {
      performSave({ silent: true });
    }, 2500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, mood, tags, hasUnsavedChanges, isEditing]);

  // Request single entry analysis
  const handleAnalyzeEntry = async () => {
    if (!content.trim()) {
      onShowToast('Write a few sentences before requesting an observation.', 'info');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await analyzeSingleEntry({
        title: title || 'Draft',
        content,
        mood,
        tags
      });
      setAnalysis(res);
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      onShowToast('Observation generated.', 'success');
    } catch (err: any) {
      console.error('Analysis error:', err);
      onShowToast('Could not generate observation.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate word count and estimated reading time
  const safeContent = content || '';
  const wordCount = safeContent.trim() ? safeContent.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Filtered entries for timeline
  const filteredEntries = useMemo(() => {
    return (entries || []).filter((e) => {
      const matchesSearch =
        searchQuery === '' ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMood =
        selectedMoodFilter === 'all' ||
        e.mood?.toLowerCase() === selectedMoodFilter.toLowerCase();

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  // Group entries by Month Year (e.g. "September 2026")
  const groupedTimeline = useMemo(() => {
    const groups: { monthYear: string; entries: JournalEntry[] }[] = [];
    filteredEntries.forEach((entry) => {
      const d = new Date(entry.createdAt);
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const existing = groups.find((g) => g.monthYear === monthYear);
      if (existing) {
        existing.entries.push(entry);
      } else {
        groups.push({ monthYear, entries: [entry] });
      }
    });
    return groups;
  }, [filteredEntries]);

  // -------------------------------------------------------------
  // VIEW 1: DISTRACTION-FREE WRITING & READING ENVIRONMENT
  // -------------------------------------------------------------
  if (isEditing) {
    const createdDate = selectedEntry?.createdAt
      ? new Date(selectedEntry.createdAt)
      : new Date();
    const formattedDate = createdDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="max-w-2xl sm:max-w-3xl mx-auto py-4 sm:py-8 animate-in fade-in duration-200">
        {/* Top Minimal Chrome */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E8E4DC] dark:border-[#2B2724] text-xs">
          <button
            id="back-to-timeline-btn"
            onClick={() => {
              if (hasUnsavedChanges) {
                onRequestConfirm(
                  'Unsaved Changes',
                  'You have unsaved edits. Would you like to save before returning to timeline?',
                  async () => {
                    await handleSave();
                    onSelectEntry(null);
                  }
                );
              } else {
                onSelectEntry(null);
              }
            }}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Unobtrusive save status */}
            <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1">
              {saveStatus === 'saving' && <span>Saving...</span>}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-3 h-3 text-stone-600 dark:text-stone-400" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'unsaved' && <span>Unsaved changes</span>}
            </span>

            {/* Save Button */}
            <button
              id="editor-save-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Save
            </button>

            {/* Delete if existing */}
            {selectedEntry?.id && (
              <button
                id="editor-delete-btn"
                onClick={() => {
                  onRequestConfirm(
                    'Delete Journal Entry?',
                    `Are you sure you want to permanently delete "${selectedEntry.title || 'this entry'}"?`,
                    async () => {
                      await onDeleteEntry(selectedEntry.id);
                      onSelectEntry(null);
                      onShowToast('Entry deleted.', 'info');
                    }
                  );
                }}
                className="p-1 text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete entry"
                aria-label="Delete entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Editor Main Content */}
        <div className="space-y-6">
          {/* Title Input */}
          <input
            id="editor-title-input"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Title of this reflection..."
            className="w-full font-editorial text-3xl sm:text-4xl font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700 bg-transparent border-0 outline-none p-0 tracking-tight leading-tight"
          />

          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-400 flex-wrap pb-2 border-b border-[#F0EDE6] dark:border-[#1E1C1A]">
            <span>{formattedDate}</span>
            <span>·</span>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{readingTimeMinutes} min read</span>

            {/* Mood selector */}
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <select
                id="editor-mood-select"
                value={mood || ''}
                onChange={(e) => {
                  setMood(e.target.value ? (e.target.value as MoodType) : undefined);
                  setHasUnsavedChanges(true);
                  setSaveStatus('unsaved');
                }}
                className="bg-transparent text-stone-600 dark:text-stone-300 outline-none text-xs cursor-pointer"
              >
                <option value="" className="dark:bg-stone-900">Add mood...</option>
                {ALL_MOODS.map((m) => (
                  <option key={m} value={m} className="dark:bg-stone-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F0EDE6] dark:bg-[#201E1C] text-stone-600 dark:text-stone-400"
              >
                #{t}
                <button
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-stone-900 dark:hover:text-stone-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {showTagInput ? (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={() => setShowTagInput(false)}
                autoFocus
                placeholder="tag name + enter"
                className="text-xs px-2 py-0.5 rounded-md border border-stone-300 dark:border-stone-700 bg-transparent text-stone-800 dark:text-stone-200 outline-none"
              />
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              >
                + tag
              </button>
            )}
          </div>

          {/* Journal Textarea */}
          <textarea
            id="editor-content-textarea"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your thoughts freely. EchoraOS will help you understand their shape over time..."
            className="w-full text-base sm:text-lg leading-relaxed text-stone-800 dark:text-stone-200 placeholder:text-stone-400/50 bg-transparent border-0 outline-none p-0 resize-none min-h-[360px]"
          />

          {/* Observation Section (Quiet, not card-cluttered) */}
          <div className="pt-8 border-t border-[#E8E4DC] dark:border-[#2B2724] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
                Observation
              </span>
              <button
                id="synthesize-observation-btn"
                onClick={handleAnalyzeEntry}
                disabled={isAnalyzing}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Observing...' : 'Synthesize reflection'}</span>
              </button>
            </div>

            {analysis && (
              <div className="space-y-3 pt-1">
                {analysis.takeaway && (
                  <p className="font-editorial text-base sm:text-lg text-stone-800 dark:text-stone-200 italic leading-relaxed">
                    "{analysis.takeaway}"
                  </p>
                )}

                {analysis.reflectionQuestions && analysis.reflectionQuestions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs text-stone-600 dark:text-stone-400 block">Questions to consider:</span>
                    <ul className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
                      {analysis.reflectionQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-stone-600 dark:text-stone-400">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: EDITORIAL TIMELINE
  // -------------------------------------------------------------
  return (
    <div className="max-w-2xl sm:max-w-3xl mx-auto py-6 sm:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E8E4DC] dark:border-[#2B2724]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            Journal
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {(entries || []).length} {(entries || []).length === 1 ? 'entry' : 'entries'} in your private archive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="timeline-new-entry-btn"
            onClick={() => onSelectEntry({} as JournalEntry)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Subtle Search & Mood Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="journal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, thoughts, tags..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-transparent border border-[#E8E4DC] dark:border-[#2B2724] rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
          />
        </div>

        {/* Subtle Mood Filter */}
        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 overflow-x-auto">
          <button
            onClick={() => setSelectedMoodFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedMoodFilter === 'all'
                ? 'bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 font-medium'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            All
          </button>
          {ALL_MOODS.slice(0, 4).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMoodFilter(m)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedMoodFilter.toLowerCase() === m.toLowerCase()
                  ? 'bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 font-medium'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      {isLoadingData && groupedTimeline.length === 0 ? (
        <div className="space-y-8 py-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-4 sm:gap-6 py-2">
              <div className="echora-skeleton h-4 w-6 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="echora-skeleton h-5 w-1/3" />
                <div className="echora-skeleton h-3.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : groupedTimeline.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="font-editorial text-2xl text-stone-800 dark:text-stone-200">
            {searchQuery || selectedMoodFilter !== 'all' ? 'No entries match your search.' : 'Your story starts here.'}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
            {searchQuery || selectedMoodFilter !== 'all'
              ? 'Try clearing your filters or search terms.'
              : 'Write something today. EchoraOS will help you understand the threads that emerge over time.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSelectEntry({} as JournalEntry)}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
            >
              Write your first entry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedTimeline.map((group) => (
            <div key={group.monthYear} className="space-y-4">
              {/* Month Header */}
              <h2 className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 pt-2 border-b border-[#F0EDE6] dark:border-[#1E1C1A] pb-1">
                {group.monthYear}
              </h2>

              {/* Entries in Month */}
              <div className="space-y-4">
                {group.entries.map((entry) => {
                  const entryDate = new Date(entry.createdAt);
                  const dayNum = String(entryDate.getDate()).padStart(2, '0');

                  return (
                    <article
                      key={entry.id}
                      id={`timeline-entry-${entry.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectEntry(entry)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectEntry(entry);
                        }
                      }}
                      className="flex items-start gap-4 sm:gap-6 py-2 group cursor-pointer transition-opacity hover:opacity-85 rounded-md"
                    >
                      {/* Day Number */}
                      <span className="font-mono text-sm sm:text-base font-semibold text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors w-6 shrink-0 pt-0.5">
                        {dayNum}
                      </span>

                      {/* Entry Summary */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-editorial text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors truncate">
                            {entry.title || 'Untitled'}
                          </h3>
                          {entry.mood && (
                            <span className="text-[11px] text-stone-600 dark:text-stone-400 font-normal shrink-0">
                              {entry.mood}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed font-normal">
                          {entry.content}
                        </p>

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            {entry.tags.slice(0, 4).map((t, idx) => (
                              <span key={idx} className="text-[11px] text-stone-600 dark:text-stone-400">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
