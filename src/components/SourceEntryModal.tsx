import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { JournalEntry } from '../types';

interface SourceEntryModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

export const SourceEntryModal: React.FC<SourceEntryModalProps> = ({ entry, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!entry) return null;

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const wordCount = entry.content ? entry.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-entry-modal-title"
    >
      <div className="bg-[#FAF8F5] dark:bg-[#161413] border border-[#E8E4DC] dark:border-[#2B2724] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Editorial Top Bar */}
        <div className="px-6 py-5 border-b border-[#E8E4DC] dark:border-[#2B2724] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
              Source Entry · Private Archive
            </span>
            <h2 id="source-entry-modal-title" className="font-editorial text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100 leading-tight">
              {entry.title || 'Untitled Entry'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 pt-0.5">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>{readingTime} min read</span>
              {entry.mood && (
                <>
                  <span>·</span>
                  <span className="text-stone-600 dark:text-stone-300 font-medium">{entry.mood}</span>
                </>
              )}
            </div>
          </div>

          <button
            id="close-source-entry-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          <div className="text-base sm:text-[17px] leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap font-normal">
            {entry.content}
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="pt-4 border-t border-[#E8E4DC] dark:border-[#2B2724] flex items-center gap-2 flex-wrap">
              {entry.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-[#EFECE6] dark:bg-[#201E1C] text-stone-600 dark:text-stone-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Takeaway if captured */}
          {entry.aiMetadata?.takeaway && (
            <div className="pt-2">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block mb-1">
                Captured Observation
              </span>
              <p className="font-editorial text-base text-stone-700 dark:text-stone-300 italic leading-relaxed">
                "{entry.aiMetadata.takeaway}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DC] dark:border-[#2B2724] bg-[#F5F2EC]/60 dark:bg-[#131211]/60 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <span>Grounded citation for EchoraOS reflection.</span>
          <button
            id="done-source-entry-modal"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium text-xs hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
