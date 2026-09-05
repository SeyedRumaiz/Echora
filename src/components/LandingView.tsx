import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Key,
  Server,
  Database,
  BookOpen,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import type { UserProfile } from '../types';

interface LandingViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  onLaunchDemo: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginSuccess,
  onLaunchDemo,
  darkMode,
  setDarkMode
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setAuthError(err?.message || 'Google sign in was cancelled or failed. You can also test with Email or Showcase Mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        const user = await signUpWithEmail(email, password);
        onLoginSuccess(user);
      } else {
        const user = await signInWithEmail(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setAuthError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#131211] text-stone-900 dark:text-stone-100 selection:bg-[#E4DFD5]">
      {/* Editorial Navigation */}
      <header className="max-w-4xl w-full mx-auto px-6 py-8 flex items-center justify-between">
        <div>
          <span className="font-editorial text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            EchoraOS
          </span>
          <span className="hidden sm:inline text-xs text-stone-500 dark:text-stone-400 ml-3 pl-3 border-l border-[#E8E4DC] dark:border-[#2B2724]">
            Your story, understood over time.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="landing-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            id="landing-signin-nav-btn"
            onClick={() => { setAuthMode('signin'); setAuthError(null); }}
            className="text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>

          <button
            id="landing-demo-top-btn"
            onClick={onLaunchDemo}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity shadow-xs"
          >
            Showcase Mode
          </button>
        </div>
      </header>

      {/* Main Editorial Hero */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center space-y-10">
        {/* Ideathon quiet marker */}
        <div className="inline-flex items-center gap-2 text-xs text-stone-400 font-mono tracking-wide">
          <span>Google Cloud Gen AI Academy APAC Ideathon</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="font-editorial text-4xl sm:text-6xl font-medium tracking-tight text-stone-900 dark:text-stone-100 leading-[1.15]">
            Your story, <br />
            <span className="italic font-normal text-stone-600 dark:text-stone-400">
              understood over time.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed pt-2 font-normal">
            A private personal reflection companion. Write freely in a calm, distraction-free journal. When you ask questions, EchoraOS reflects on your thoughts with honest citations to your own history.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
          <button
            id="hero-launch-demo-btn"
            onClick={onLaunchDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Explore Showcase Mode</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-google-auth-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent text-stone-800 dark:text-stone-200 font-medium text-sm hover:bg-[#F0EDE6] dark:hover:bg-[#1E1C1A] transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {authError && (
          <div className="p-3 rounded-lg text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 max-w-md">
            {authError}
          </div>
        )}

        {/* Editorial Preview: Talk to your history */}
        <div className="w-full max-w-2xl text-left pt-12 space-y-4 border-t border-[#E8E4DC] dark:border-[#2B2724]">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-400 block">
            The Reflection Experience
          </span>

          <div className="space-y-6 pt-2">
            <div className="flex justify-end">
              <div className="bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 rounded-2xl px-5 py-3 text-sm max-w-md leading-relaxed">
                "What has been draining my energy recently?"
              </div>
            </div>

            <div className="space-y-3 max-w-lg">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                EchoraOS
              </div>
              <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed font-normal">
                Across three recent entries, you have returned to questions about taking on too many commitments and context-switching without recovery time.
              </p>
              <div className="pt-2 border-t border-[#F0EDE6] dark:border-[#201E1C] space-y-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-400 block">
                  Sources
                </span>
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5 font-normal">
                  <div>03 Sep — "Mid-week check-in: Feeling productive yet restless"</div>
                  <div>01 Sep — "A difficult decision about pacing"</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Principles / Pillars */}
        <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left border-t border-[#E8E4DC] dark:border-[#2B2724]">
          <div className="space-y-1.5">
            <h3 className="font-editorial text-lg font-medium text-stone-900 dark:text-stone-100">
              Strict User Isolation
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Enforced at the Firestore rule layer. Every document is strictly partitioned under <code className="text-[10px] font-mono bg-stone-200/50 dark:bg-stone-800 px-1 py-0.5 rounded">users/&#123;uid&#125;</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-editorial text-lg font-medium text-stone-900 dark:text-stone-100">
              Grounded AI Reflection
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Powered by Gemini 2.5 Flash. Cites exact journal entries and never hallucinates facts about your private life.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-editorial text-lg font-medium text-stone-900 dark:text-stone-100">
              Zero Secret Leakage
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              API secrets are managed through Google Cloud Secret Manager. No keys are ever packed into client-side bundles.
            </p>
          </div>
        </div>
      </main>

      {/* Auth Modal (Email/Password alternative) */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FAF8F5] dark:bg-[#161413] border border-[#E8E4DC] dark:border-[#2B2724] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-medium text-stone-900 dark:text-stone-100">
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </h3>
              <button
                id="close-auth-modal"
                onClick={() => setAuthMode(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent text-stone-900 dark:text-stone-100 text-sm outline-none focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent text-stone-900 dark:text-stone-100 text-sm outline-none focus:border-stone-400"
                />
              </div>

              {authError && (
                <div className="p-2 rounded text-xs text-red-600 dark:text-red-400">
                  {authError}
                </div>
              )}

              <button
                id="submit-email-auth-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium text-sm hover:opacity-90 transition-opacity"
              >
                {loading ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                  className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline"
                >
                  {authMode === 'signup'
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E8E4DC] dark:border-[#2B2724] py-8 text-center text-xs text-stone-400">
        <p>EchoraOS · Private AI-Powered Reflection System</p>
        <p className="mt-1">Built with Gemini 2.5 Flash, Cloud Firestore & Google Cloud Run</p>
      </footer>
    </div>
  );
};
