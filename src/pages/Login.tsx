import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black text-[#E1E0CC] flex flex-col justify-center items-center p-6 font-sans relative overflow-hidden"
    >
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#E1E0CC] transition-colors">
        <ArrowLeft size={16} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#101010] p-10 rounded-[2rem] shadow-2xl border border-white/5"
      >
        <h2 className="text-3xl md:text-4xl font-medium mb-2 tracking-tight">Sign In</h2>
        <p className="text-gray-500 text-sm mb-8">Continue your journey of discipline.</p>

        {error && <div className="bg-red-950/30 text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-900/30">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#212121] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#212121] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full group flex items-center justify-between gap-2 bg-primary rounded-full pl-6 pr-2 py-2 text-black font-medium text-sm hover:gap-3 transition-all duration-300 disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign In"}
            <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center text-[#E1E0CC] group-hover:scale-110 transition-transform duration-300">
              <ArrowRight size={18} />
            </div>
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account? <Link to="/signup" className="text-[#E1E0CC] hover:text-primary transition-colors">Sign up</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
