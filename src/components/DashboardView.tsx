import React from 'react';
import { TodayView } from './TodayView';
import type { JournalEntry, LongitudinalInsight, UserProfile, ActiveTab } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  latestInsight: LongitudinalInsight | null;
  onNavigate: (tab: ActiveTab) => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onStartChatWithPrompt: (promptText: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = (props) => {
  return <TodayView {...props} />;
};
