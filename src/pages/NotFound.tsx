import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { usePageMeta } from '../hooks/usePageMeta';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Sign In', to: '/login' },
  { label: 'Sign Up', to: '/signup' },
];

export default function NotFound() {
  usePageMeta("Page Not Found — Habits", "The page you're looking for doesn't exist.");
  const [menuOpen, setMenuOpen] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [scaleY, setScaleY] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (textRef.current) {
        const h = textRef.current.offsetHeight;
        if (h > 0) {
          setScaleY(window.innerHeight / h);
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <motion.div
      id="main-content"
      tabIndex={-1}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative w-full min-h-dvh overflow-hidden flex flex-col bg-black focus:outline-none"
    >
      {/* Background 404 text mask */}
      <div
        className="absolute inset-0 pointer-events-none opacity-80 flex items-center justify-center overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
        }}
      >
        <div
          ref={textRef}
          className="text-[#E1E0CC] font-black leading-none tracking-tighter whitespace-nowrap text-[clamp(200px,48vw,800px)] absolute"
          style={{ transform: `scale(1.15, ${scaleY * 1.4})`, transformOrigin: 'center' }}
        >
          404
        </div>
        <div
          className="bg-gradient-to-b from-primary/0 via-primary to-primary rounded-full h-[22vh] sm:h-[26vh] md:h-[50vh] w-[clamp(120px,20vw,400px)] absolute"
          style={{ transform: `scale(1, ${scaleY})`, transformOrigin: 'center' }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex flex-row items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5">
        <Link to="/" className="flex items-center">
          <div className="grid grid-cols-2 gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
            ))}
          </div>
          <span className="text-[#E1E0CC] font-bold text-lg sm:text-xl ml-2 tracking-tight">Habits</span>
        </Link>

        <div className="hidden md:flex gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-primary text-black hover:opacity-90 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-black bg-primary hover:opacity-90 transition-colors flex items-center gap-2"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm font-medium hidden sm:inline">Menu</span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'pointer-events-auto' : ''}`}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[380px] bg-[#101010] border-l border-white/5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 h-full relative flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="grid grid-cols-2 gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
                  ))}
                </div>
                <span className="text-[#E1E0CC] font-bold text-lg sm:text-xl ml-2 tracking-tight">Habits</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 text-[#E1E0CC] hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {NAV_LINKS.map(({ label, to }, i) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`px-6 py-4 text-lg font-semibold text-[#E1E0CC] rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 block transform ${
                    menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: menuOpen ? `${150 + i * 60}ms` : '0ms' }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className={`w-full py-4 rounded-full bg-primary font-semibold text-base text-black hover:scale-[1.02] flex items-center justify-center gap-2 transition-all duration-300 transform ${
                  menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: menuOpen ? '450ms' : '0ms' }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Habits
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Center video */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 min-h-0">
        <div className="w-full max-w-xs sm:max-w-sm rounded-3xl overflow-hidden border border-white/5 bg-[#101010] aspect-square">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4"
          />
        </div>
      </div>

      {/* Bottom content */}
      <div className="relative z-30 mt-auto pb-8 sm:pb-16 flex flex-col items-center text-center px-4">
        <h1 className="text-[#E1E0CC] text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4">
          This page skipped a day.
        </h1>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-black bg-primary font-semibold text-sm sm:text-base hover:scale-105 active:scale-100 hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Habits
        </Link>
      </div>
    </motion.div>
  );
}
