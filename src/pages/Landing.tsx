import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      className="w-full bg-black min-h-screen text-[#E1E0CC] selection:bg-[#E1E0CC]/30 selection:text-black"
    >
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
    </motion.main>
  );
}

// ---- SECTION 1: HERO ----
function HeroSection() {
  return (
    <section className="h-screen w-full p-4 md:p-6 relative">
      <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <nav className="bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8 flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14">
            {["Overview", "Methodology", "Features", "Sign In"].map((item) => {
              if (item === "Sign In") {
                return (
                  <Link
                    key={item}
                    to="/login"
                    className="text-[10px] sm:text-xs md:text-sm transition-colors duration-300 whitespace-nowrap"
                    style={{ color: "rgba(225, 224, 204, 0.8)" }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                  >
                    {item}
                  </Link>
                );
              }
              return (
                <a
                  key={item}
                  href="#"
                  className="text-[10px] sm:text-xs md:text-sm transition-colors duration-300 whitespace-nowrap"
                  style={{ color: "rgba(225, 224, 204, 0.8)" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                >
                  {item}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 xl:p-20 z-10 pb-8 md:pb-12">
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 md:col-span-8">
              <WordsPullUp
                text="Habits"
                className="text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] font-medium leading-[0.85] tracking-[-0.07em] text-[#E1E0CC]"
                showAsterisk
              />
            </div>
            <div className="col-span-12 md:col-span-4 flex flex-col gap-8 md:pb-8">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-primary/70 text-xs sm:text-sm md:text-base leading-[1.2]"
              >
                A minimalist, focused space to build routines, track progress, and unlock your 
                potential through daily discipline. No distractions, just consistency.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link to="/signup" className="group inline-flex items-center justify-between gap-2 bg-primary rounded-full pl-6 pr-2 py-2 text-black font-medium text-sm sm:text-base hover:gap-3 transition-all duration-300">
                  Start tracking
                  <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#E1E0CC] group-hover:scale-110 transition-transform duration-300">
                    <ArrowRight size={18} />
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- SECTION 2: ABOUT ----
function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.2"],
  });

  const bodyText =
    "Over the last few years, we realized that the key to achieving any goal isn't motivation—it's building an unbreakable routine. We built this tracker to give you a clear, distraction-free environment to monitor your daily habits and visualize your long-term progress.";
  const chars = bodyText.split("");

  return (
    <section className="w-full bg-black py-24 px-4 md:px-6">
      <div className="bg-[#101010] rounded-2xl md:rounded-[2rem] p-8 md:p-16 lg:p-24 flex flex-col items-center text-center max-w-6xl mx-auto">
        <span className="text-primary text-[10px] sm:text-xs uppercase tracking-widest mb-12">
          Discipline
        </span>
        
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-3xl mx-auto leading-[0.95] sm:leading-[0.9] mb-16 text-[#E1E0CC]">
          <WordsPullUpMultiStyle
            segments={[
              { text: "We believe that ", className: "font-normal" },
              { text: "consistency is everything. ", className: "font-serif italic" },
              { text: "Track daily, build streaks, and transform your life.", className: "font-normal" }
            ]}
          />
        </div>

        <div ref={containerRef} className="max-w-xl mx-auto flex flex-wrap justify-center text-center">
          <p className="text-[#DEDBC8] text-xs sm:text-sm md:text-base leading-relaxed">
            {chars.map((char, i) => {
              const charProgress = i / chars.length;
              const start = Math.max(0, charProgress - 0.1);
              const end = Math.min(1, charProgress + 0.05);
              
              return (
                <AnimatedLetter
                  key={i}
                  char={char}
                  progress={scrollYProgress}
                  range={[start, end]}
                />
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

function AnimatedLetter({ char, progress, range }: any) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity }}>{char}</motion.span>;
}

// ---- SECTION 3: FEATURES ----
function FeaturesSection() {
  return (
    <section className="w-full min-h-screen bg-black relative py-24 px-4 md:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto">
        <div className="mb-16">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight">
            <WordsPullUpMultiStyle
              segments={[
                { text: "Distraction-free tracking for ambitious goals.", className: "text-[#E1E0CC] block mb-2" },
                { text: "Built for focus. Powered by consistency.", className: "text-gray-500 block" }
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 md:gap-1">
          <FeatureCard index={0}>
            <div className="relative w-full h-full min-h-[300px] lg:h-[480px] rounded-2xl md:rounded-3xl overflow-hidden bg-[#212121]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute bottom-6 left-6 z-10">
                <span className="text-[#E1E0CC] text-sm md:text-base font-medium">Your daily canvas.</span>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard index={1}>
            <div className="w-full h-full min-h-[300px] lg:h-[480px] rounded-2xl md:rounded-3xl bg-[#212121] p-6 flex flex-col justify-between">
              <div>
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85"
                  alt="Icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover mb-8"
                />
                <h3 className="text-[#E1E0CC] text-xl font-medium mb-6">
                  Visual Heatmaps. <span className="text-gray-500 text-sm">(01)</span>
                </h3>
                <ul className="space-y-4">
                  {[
                    "Track daily completions",
                    "Visualize 365-day progress",
                    "Identify success patterns",
                    "Maintain your streaks"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-primary shrink-0 mt-0.5" size={16} />
                      <span className="text-gray-400 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#" className="inline-flex items-center gap-2 text-[#E1E0CC] text-sm mt-8 hover:text-primary transition-colors">
                Learn more <ArrowRight size={14} className="-rotate-45" />
              </a>
            </div>
          </FeatureCard>

          <FeatureCard index={2}>
            <div className="w-full h-full min-h-[300px] lg:h-[480px] rounded-2xl md:rounded-3xl bg-[#212121] p-6 flex flex-col justify-between">
              <div>
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85"
                  alt="Icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover mb-8"
                />
                <h3 className="text-[#E1E0CC] text-xl font-medium mb-6">
                  Unbreakable Streaks. <span className="text-gray-500 text-sm">(02)</span>
                </h3>
                <ul className="space-y-4">
                  {[
                    "Longest streak tracking",
                    "Current run metrics",
                    "Total days completed"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-primary shrink-0 mt-0.5" size={16} />
                      <span className="text-gray-400 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#" className="inline-flex items-center gap-2 text-[#E1E0CC] text-sm mt-8 hover:text-primary transition-colors">
                Learn more <ArrowRight size={14} className="-rotate-45" />
              </a>
            </div>
          </FeatureCard>

          <FeatureCard index={3}>
            <div className="w-full h-full min-h-[300px] lg:h-[480px] rounded-2xl md:rounded-3xl bg-[#212121] p-6 flex flex-col justify-between">
              <div>
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85"
                  alt="Icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover mb-8"
                />
                <h3 className="text-[#E1E0CC] text-xl font-medium mb-6">
                  Deep Focus. <span className="text-gray-500 text-sm">(03)</span>
                </h3>
                <ul className="space-y-4">
                  {[
                    "Distraction-free interface",
                    "Dark mode optimized",
                    "Lightning fast logging"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-primary shrink-0 mt-0.5" size={16} />
                      <span className="text-gray-400 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#" className="inline-flex items-center gap-2 text-[#E1E0CC] text-sm mt-8 hover:text-primary transition-colors">
                Learn more <ArrowRight size={14} className="-rotate-45" />
              </a>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// ---- SHARED COMPONENTS ----
function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
}: {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="relative inline-flex overflow-hidden mr-[0.25em]">
          <motion.span
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{
              duration: 0.8,
              delay: i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block relative"
          >
            {word}
            {showAsterisk && i === words.length - 1 && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] leading-none">
                *
              </span>
            )}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

function WordsPullUpMultiStyle({ segments }: { segments: { text: string; className: string }[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  let globalWordIndex = 0;

  return (
    <div ref={ref} className="inline-flex flex-wrap justify-center">
      {segments.map((segment, segIdx) => {
        const words = segment.text.split(" ").filter((w) => w.length > 0);
        return (
          <span key={segIdx} className={segment.className}>
            {words.map((word, wIdx) => {
              const currentIdx = globalWordIndex++;
              return (
                <span key={wIdx} className="inline-flex overflow-hidden mr-[0.25em] relative">
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: currentIdx * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}
