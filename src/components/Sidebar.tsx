import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Sparkles,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import type { ActiveTab, JournalEntry, UserProfile } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  entries: JournalEntry[];
  onNewEntry: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onSignOut: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  entries = [],
  onNewEntry,
  onSelectEntry,
  onSignOut,
  darkMode,
  setDarkMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Normalize active tab (handle today/dashboard and reflect/chat aliases)
  const isTabActive = (id: string) => {
    if (id === 'today') return activeTab === 'today' || activeTab === 'dashboard';
    if (id === 'reflect') return activeTab === 'reflect' || activeTab === 'chat';
    return activeTab === id;
  };

  const safeEntries = Array.isArray(entries) ? entries : [];

  const navItems = [
    { id: 'today' as ActiveTab, label: 'Today', icon: Compass },
    { id: 'journal' as ActiveTab, label: 'Journal', icon: BookOpen, count: safeEntries.length },
    { id: 'reflect' as ActiveTab, label: 'Reflect', icon: Sparkles },
    { id: 'insights' as ActiveTab, label: 'Insights', icon: BarChart3 }
  ];

  const recentEntries = safeEntries.slice(0, 4);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#FAF8F5]/90 dark:bg-[#131211]/90 backdrop-blur-md border-b border-[#E8E4DC] dark:border-[#2B2724] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setActiveTab('today')}
          className="flex items-center gap-2 text-left"
        >
          <img src="/icon-192.png" alt="" className="w-6 h-6 rounded-md" />
          <span className="font-editorial text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            EchoraOS
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="mobile-new-entry-btn"
            onClick={onNewEntry}
            className="p-2 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium"
            title="New entry"
            aria-label="New entry"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bottom-0 z-30 bg-[#FAF8F5] dark:bg-[#131211] p-6 flex flex-col justify-between overflow-y-auto border-b border-[#E8E4DC] dark:border-[#2B2724]">
          <div className="space-y-6">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isTabActive(item.id);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors ${
                      active
                        ? 'bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/60 dark:hover:bg-stone-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-normal">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Recent in Mobile Drawer */}
            {recentEntries.length > 0 && (
              <div className="pt-4 border-t border-[#E8E4DC] dark:border-[#2B2724] space-y-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 px-3.5">
                  Recent
                </span>
                <div className="space-y-1">
                  {recentEntries.map((entry) => (
                    <button
                      key={entry.id}
                      title={entry.title || 'Untitled'}
                      onClick={() => {
                        onSelectEntry(entry);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/50 dark:hover:bg-stone-800/40 truncate block"
                    >
                      {entry.title || 'Untitled'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#E8E4DC] dark:border-[#2B2724] space-y-3">
            <button
              onClick={() => {
                setActiveTab('settings');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              <div className="flex items-center gap-3">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </div>
            </button>

            {user && (
              <div className="flex items-center justify-between pt-3 px-3.5">
                <div className="text-left">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {user.displayName || 'User'}
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-400 truncate max-w-[180px]" title={user.email || undefined}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Navigation Rail / Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-[#E8E4DC] dark:border-[#2B2724] bg-[#FAF8F5] dark:bg-[#131211] p-5 h-screen sticky top-0 overflow-y-auto select-none">
        {/* Brand Header */}
        <div className="mb-6 px-2">
          <button
            id="brand-home-btn"
            onClick={() => setActiveTab('today')}
            className="text-left group block w-full"
          >
            <span className="flex items-center gap-2 group-hover:opacity-80 transition-opacity">
              <img src="/icon-192.png" alt="" className="w-7 h-7 rounded-md shrink-0" />
              <span className="font-editorial text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
                EchoraOS
              </span>
            </span>
            <span className="text-[12px] text-stone-500 dark:text-stone-400 tracking-normal block mt-0.5 font-light">
              Your story, understood over time.
            </span>
          </button>
        </div>

        {/* Start Writing Action */}
        <div className="mb-6 px-1">
          <button
            id="sidebar-new-entry-btn"
            onClick={onNewEntry}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write Entry</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1 mb-8">
          {navItems.map((item) => {
            const active = isTabActive(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 font-semibold shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-xs text-stone-600 dark:text-stone-400 font-normal">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Recent Section */}
        {recentEntries.length > 0 && (
          <div className="mb-auto space-y-2 px-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
                Recent
              </span>
              <button
                onClick={() => setActiveTab('journal')}
                className="text-[11px] text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              >
                View all
              </button>
            </div>
            <div className="space-y-0.5">
              {recentEntries.map((entry) => {
                const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
                return (
                  <button
                    key={entry.id}
                    id={`sidebar-recent-${entry.id}`}
                    onClick={() => onSelectEntry(entry)}
                    className="w-full text-left px-2.5 py-2 rounded-md text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817] transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate pr-2" title={entry.title || 'Untitled'}>{entry.title || 'Untitled'}</span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400 shrink-0 group-hover:text-stone-500">
                      {dateStr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Rail: Settings, Theme & User Profile */}
        <div className="pt-4 border-t border-[#E8E4DC] dark:border-[#2B2724] space-y-1 px-1 mt-6">
          <button
            id="sidebar-nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817]'
            }`}
          >
            <Settings className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <span>Settings</span>
          </button>

          <button
            id="sidebar-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#F3F0EA] dark:hover:bg-[#1A1817] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600 dark:text-stone-400" />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
          </button>

          {user && (
            <div className="pt-3 mt-2 border-t border-[#E8E4DC] dark:border-[#2B2724] flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full ring-1 ring-[#E8E4DC] dark:ring-[#2B2724] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-medium text-xs shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate" title={user.displayName || 'User'}>
                    {user.displayName || 'User'}
                  </div>
                  <div className="text-[10px] text-stone-600 dark:text-stone-400 truncate" title={user.isDemo ? 'Showcase mode' : (user.email || undefined)}>
                    {user.isDemo ? 'Showcase mode' : user.email}
                  </div>
                </div>
              </div>

              <button
                id="sidebar-sign-out-btn"
                onClick={onSignOut}
                className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
