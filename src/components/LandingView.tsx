import React, { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { ArrowRight, Mail, Sun, Moon } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import type { UserProfile } from '../types';

interface LandingViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  onLaunchDemo: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

// Fixed positions for the ambient "constellation" of moments behind the
// hero — hand-placed (not randomized per render) so the scene is stable
// and never redistributes itself on re-render.
const HERO_MOTES: { left: string; top: string; size: number; delay: string }[] = [
  { left: '8%', top: '22%', size: 3, delay: '0s' },
  { left: '15%', top: '68%', size: 2, delay: '0.6s' },
  { left: '24%', top: '40%', size: 2, delay: '1.4s' },
  { left: '88%', top: '18%', size: 3, delay: '0.3s' },
  { left: '80%', top: '62%', size: 2, delay: '2.1s' },
  { left: '92%', top: '78%', size: 2, delay: '1s' },
  { left: '50%', top: '10%', size: 2, delay: '1.8s' },
  { left: '6%', top: '85%', size: 2, delay: '2.6s' },
  { left: '68%', top: '88%', size: 3, delay: '0.9s' },
];

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

  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const beginRef = useRef<HTMLElement>(null);

  // Mouse-reactive parallax for the ambient background layer only —
  // small, spring-smoothed, and only ever engaged on pointers that
  // reported a real hover-capable, fine-pointer device (see
  // handlePointerMove). Reduced-motion visitors never trigger it since
  // the handler itself is a no-op for them.
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 40, damping: 20, mass: 0.6 });
  const springY = useSpring(mvY, { stiffness: 40, damping: 20, mass: 0.6 });
  const glowAX = springX;
  const glowAY = springY;
  const glowBX = useTransform(springX, (v) => -v);
  const glowBY = useTransform(springY, (v) => -v);
  const moteX = useTransform(springX, (v) => v * 1.6);
  const moteY = useTransform(springY, (v) => v * 1.6);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || e.pointerType !== 'mouse' || !heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      const max = 18;
      mvX.set(relX * max * 2);
      mvY.set(relY * max * 2);
    },
    [prefersReducedMotion, mvX, mvY]
  );

  const handlePointerLeave = useCallback(() => {
    mvX.set(0);
    mvY.set(0);
  }, [mvX, mvY]);

  const scrollToBegin = () => {
    beginRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    // Move focus along with the scroll so keyboard and screen-reader
    // users land where the page visually goes, not just mouse users.
    window.setTimeout(() => beginRef.current?.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 450);
  };

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

  // A single stagger for the hero's entrance — collapses to an
  // instant, motionless appearance when the visitor has asked for
  // reduced motion.
  const heroContainerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: prefersReducedMotion ? 0 : 0.15
      }
    }
  };
  const riseIn = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.7, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131211] text-stone-900 dark:text-stone-100 selection:bg-[#E4DFD5]">
      {/* ============================================================
          HERO SCENE — the cinematic opening moment
          ============================================================ */}
      <div
        ref={heroRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative min-h-[100dvh] flex flex-col overflow-hidden"
      >
        {/* Ambient background — decorative only, never in the tab order */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <motion.div style={{ x: glowAX, y: glowAY }} className="absolute -top-24 -left-24 w-[34rem] h-[34rem]">
            <div className="w-full h-full rounded-full bg-[#E2DCD4] dark:bg-[#3A342C] blur-3xl opacity-40 echora-glow-drift" />
          </motion.div>
          <motion.div style={{ x: glowBX, y: glowBY }} className="absolute -bottom-40 -right-32 w-[30rem] h-[30rem]">
            <div className="w-full h-full rounded-full bg-[#EDE7DC] dark:bg-[#2A2620] blur-3xl opacity-40 echora-glow-drift" style={{ animationDelay: '-9s' }} />
          </motion.div>

          {/* Echoing rings, centered behind the wordmark */}
          <div className="absolute left-1/2 top-[44%] w-[20rem] h-[20rem] -ml-[10rem] -mt-[10rem] sm:w-[26rem] sm:h-[26rem] sm:-ml-[13rem] sm:-mt-[13rem]">
            <span className="echora-ring" style={{ animationDelay: '0s' }} />
            <span className="echora-ring" style={{ animationDelay: '2.2s' }} />
            <span className="echora-ring" style={{ animationDelay: '4.4s' }} />
          </div>

          {/* A sparse constellation of moments */}
          <motion.div style={{ x: moteX, y: moteY }} className="absolute inset-0">
            {HERO_MOTES.map((m, i) => (
              <span
                key={i}
                className="echora-mote absolute rounded-full bg-stone-500/40 dark:bg-stone-300/30"
                style={{ left: m.left, top: m.top, width: m.size, height: m.size, animationDelay: m.delay }}
              />
            ))}
          </motion.div>
        </div>

        {/* Minimal overlay nav */}
        <header className="relative z-10 max-w-5xl w-full mx-auto px-6 py-6 flex items-center justify-between">
          <button
            id="landing-logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })}
            className="p-0.5 opacity-80 hover:opacity-100 transition-opacity"
            aria-label="EchoraOS — scroll to top"
          >
            <img src="/icon-192.png" alt="" className="w-7 h-7 rounded-md block" />
          </button>

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

        {/* Centered hero content */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 -mt-8"
        >
          <motion.span
            variants={riseIn}
            className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-mono tracking-wide mb-6"
          >
            Google Cloud Gen AI Academy APAC Ideathon
          </motion.span>

          <motion.h1
            variants={riseIn}
            className="font-editorial font-medium tracking-tight text-stone-900 dark:text-stone-100 leading-[0.98]"
            style={{ fontSize: 'clamp(3.25rem, 10vw, 7rem)' }}
          >
            EchoraOS
          </motion.h1>

          <motion.p
            variants={riseIn}
            className="font-editorial italic text-stone-600 dark:text-stone-400 mt-4"
            style={{ fontSize: 'clamp(1.1rem, 2.4vw, 1.6rem)' }}
          >
            Your story, understood over time.
          </motion.p>

          <motion.div variants={riseIn} className="flex flex-col sm:flex-row items-center gap-3 mt-10">
            <button
              id="hero-begin-btn"
              onClick={scrollToBegin}
              className="px-7 py-3.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Begin your story</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-explore-btn"
              onClick={onLaunchDemo}
              className="px-6 py-3.5 rounded-xl text-stone-700 dark:text-stone-300 font-medium text-sm hover:text-stone-900 dark:hover:text-stone-100 transition-colors underline decoration-[#D8D2C6] dark:decoration-[#2E2A25] decoration-1 underline-offset-4"
            >
              Explore EchoraOS
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll cue — purely decorative, so it is skipped entirely
            (not just visually stilled) under reduced motion rather
            than left inert on screen. */}
        {!prefersReducedMotion && (
          <div
            className="relative z-10 pb-8 flex flex-col items-center gap-1.5 text-stone-400 dark:text-stone-600"
            aria-hidden="true"
          >
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
            <span className="echora-scroll-cue block w-px h-6 bg-current" />
          </div>
        )}
      </div>

      {/* ============================================================
          ARRIVAL — the real entry points
          ============================================================ */}
      <section
        id="begin"
        ref={beginRef}
        tabIndex={-1}
        className="max-w-3xl w-full mx-auto px-6 pt-20 pb-16 scroll-mt-6 outline-none"
      >
        <div className="text-center space-y-3 mb-10">
          <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            Begin your story
          </h2>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
            A private, distraction-free journal. When you ask questions, EchoraOS reflects on your own history — with honest citations, never invention.
          </p>
        </div>

        <div className="max-w-sm mx-auto space-y-3">
          <button
            id="hero-google-auth-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent text-stone-800 dark:text-stone-200 font-medium text-sm hover:bg-[#F0EDE6] dark:hover:bg-[#1E1C1A] transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60"
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

          <button
            id="hero-email-auth-btn"
            onClick={() => { setAuthMode('signin'); setAuthError(null); }}
            className="w-full px-5 py-3 rounded-xl border border-[#E8E4DC] dark:border-[#2B2724] bg-transparent text-stone-800 dark:text-stone-200 font-medium text-sm hover:bg-[#F0EDE6] dark:hover:bg-[#1E1C1A] transition-colors flex items-center justify-center gap-2.5"
          >
            <Mail className="w-4 h-4" />
            <span>Continue with email</span>
          </button>

          {authError && (
            <div className="p-3 rounded-lg text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              {authError}
            </div>
          )}

          <p className="text-center text-xs text-stone-500 dark:text-stone-500 pt-2">
            Just looking?{' '}
            <button
              id="hero-launch-demo-btn"
              onClick={onLaunchDemo}
              className="underline hover:text-stone-800 dark:hover:text-stone-300"
            >
              Explore Showcase Mode
            </button>
          </p>
        </div>

        {/* Editorial Preview: Talk to your history */}
        <div className="w-full text-left pt-16 mt-12 space-y-4 border-t border-[#E8E4DC] dark:border-[#2B2724]">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
            The Reflection Experience
          </span>

          <div className="space-y-6 pt-2">
            <div className="flex justify-end">
              <div className="bg-[#EFECE6] dark:bg-[#201E1C] text-stone-900 dark:text-stone-100 rounded-2xl px-5 py-3 text-sm max-w-md leading-relaxed">
                "What has been draining my energy recently?"
              </div>
            </div>

            <div className="space-y-3 max-w-lg">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
                EchoraOS
              </div>
              <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed font-normal">
                Across three recent entries, you have returned to questions about taking on too many commitments and context-switching without recovery time.
              </p>
              <div className="pt-2 border-t border-[#F0EDE6] dark:border-[#201E1C] space-y-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 block">
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
        <div className="pt-16 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left border-t border-[#E8E4DC] dark:border-[#2B2724]">
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
      </section>

      {/* Auth Modal (Email/Password alternative) */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FAF8F5] dark:bg-[#161413] border border-[#E8E4DC] dark:border-[#2B2724] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-medium text-stone-900 dark:text-stone-100">
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </h3>
              <button
                id="close-auth-modal"
                onClick={() => setAuthMode(null)}
                className="text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
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
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
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
      <footer className="border-t border-[#E8E4DC] dark:border-[#2B2724] py-8 text-center text-xs text-stone-600 dark:text-stone-400">
        <p>EchoraOS · Private AI-Powered Reflection System</p>
        <p className="mt-1">Built with Gemini 2.5 Flash, Cloud Firestore & Google Cloud Run</p>
      </footer>
    </div>
  );
};
