import { useState } from "react";
import { motion } from "motion/react";
import { Circle, GitFork, Eye, EyeOff } from "lucide-react";

export default function App() {
  return (
    <main className="flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
      <HeroColumn />
      <FormColumn />
    </main>
  );
}

function HeroColumn() {
  return (
    <div className="hidden lg:flex relative flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full w-[52%]">
      <div className="absolute inset-0 bg-brand-gray overflow-hidden">
        <div className="hero-blob hero-blob-a top-[-10%] left-[-10%] h-[60%] w-[60%] bg-white/10" />
        <div className="hero-blob hero-blob-b bottom-[-15%] right-[-10%] h-[65%] w-[65%] bg-white/[0.07]" />
        <div className="hero-blob hero-blob-c top-[30%] left-[20%] h-[45%] w-[45%] bg-white/[0.05]" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 },
          },
        }}
        className="relative z-10 w-full max-w-xs space-y-8"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
          className="flex items-center gap-2"
        >
          <Circle className="fill-white text-white" size={20} />
          <span className="text-xl font-semibold tracking-tight">Habit Tracker</span>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap">
            Join Habit Tracker
          </h1>
          <p className="text-white/60 text-sm leading-relaxed px-4 mt-2">
            Follow these 2 quick phases to activate your space.
          </p>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
          className="space-y-3"
        >
          <StepItem number={1} text="Register your identity" active />
          <StepItem number={2} text="Finalize your profile" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function FormColumn() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
      >
        <div>
          <h2 className="text-3xl font-medium tracking-tight">Create New Profile</h2>
          <p className="text-white/40 text-sm mt-1">
            Input your basic details to begin the journey.
          </p>
        </div>

        <div>
          <SocialButton icon={<GitFork size={18} />} label="Github" />
        </div>

        <div className="relative flex items-center">
          <div className="w-full border-t border-white/10" />
          <span className="absolute left-1/2 -translate-x-1/2 bg-black px-4 text-xs font-medium text-white/40 uppercase tracking-widest">
            Or
          </span>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="First name" placeholder="Ada" type="text" />
            <InputGroup label="Last name" placeholder="Lovelace" type="text" />
          </div>

          <InputGroup label="Email" placeholder="you@example.com" type="email" />

          <div>
            <label className="text-sm font-medium text-white">Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-brand-gray border-none rounded-xl h-11 px-4 pr-11 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1.5">Requires at least 8 symbols.</p>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] mt-4 transition"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-white/40">
          Member of the team?{" "}
          <a href="#" className="text-white hover:underline">
            Log in
          </a>
        </p>
      </motion.div>
    </div>
  );
}

function StepItem({
  number,
  text,
  active = false,
}: {
  number: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
        active
          ? "bg-white text-black border border-white"
          : "bg-brand-gray text-white border-none"
      }`}
    >
      <span
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-medium ${
          active ? "bg-black text-white" : "bg-white/10 text-white/40"
        }`}
      >
        {number}
      </span>
      {text}
    </div>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 h-11 bg-black border border-white/10 rounded-xl hover:bg-white/5 text-sm font-medium transition"
    >
      {icon}
      {label}
    </button>
  );
}

function InputGroup({
  label,
  placeholder,
  type,
}: {
  label: string;
  placeholder: string;
  type: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-white">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full mt-1.5 bg-brand-gray border-none rounded-xl h-11 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20 outline-none"
      />
    </div>
  );
}
