import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh bg-black text-[#E1E0CC] flex flex-col items-center justify-center p-6 font-sans text-center"
    >
      <span className="font-serif italic text-primary/60 text-2xl sm:text-3xl mb-2">
        Missed a day.
      </span>
      <h1 className="text-[20vw] sm:text-[14vw] md:text-[10rem] font-medium leading-none tracking-[-0.05em] text-[#E1E0CC]">
        404
      </h1>
      <p className="text-gray-500 text-sm sm:text-base mt-4 mb-10 max-w-sm">
        This page doesn't exist. Let's get you back on track.
      </p>
      <Link
        to="/"
        className="group inline-flex items-center justify-between gap-2 bg-primary rounded-full pl-6 pr-2 py-2 text-black font-medium text-sm sm:text-base hover:gap-3 active:scale-[0.98] transition-all duration-300"
      >
        Back to Habits
        <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#E1E0CC] group-hover:scale-110 transition-transform duration-300">
          <ArrowRight size={18} />
        </div>
      </Link>
    </motion.div>
  );
}
