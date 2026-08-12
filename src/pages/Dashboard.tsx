import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, Plus, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Heatmap from "../components/Heatmap";

interface Habit {
  id: number;
  name: string;
  created_on: string;
  done: boolean;
  current: number;
  longest: number;
  total: number;
  days: string[];
}

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState<string>("");
  const [newHabitName, setNewHabitName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<number | "overview">("overview");

  const loadHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setHabits(data.habits || []);
      setToday(data.today || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleToggle = async (habitId: number, day: string) => {
    // Optimistic update
    setHabits(current => current.map(h => {
      if (h.id === habitId) {
        const isDone = h.days.includes(day);
        const newDays = isDone ? h.days.filter(d => d !== day) : [...h.days, day];
        return { ...h, done: day === today ? !isDone : h.done, days: newDays };
      }
      return h;
    }));

    try {
      await fetch("/api/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId, day }),
      });
      loadHabits(); // Reload for accurate streaks
    } catch (err) {
      console.error(err);
      loadHabits(); // Revert
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    
    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHabitName }),
      });
      setNewHabitName("");
      loadHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (habitId: number) => {
    if (!confirm("Are you sure you want to delete this habit and all its history?")) return;
    try {
      await fetch(`/api/habits/${habitId}/delete`, {
        method: "POST",
      });
      if (activeView === habitId) setActiveView("overview");
      loadHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (isLoading) {
    return <div className="min-h-dvh bg-black flex items-center justify-center text-[#E1E0CC]">Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh bg-black text-[#E1E0CC] font-sans flex flex-col md:flex-row"
    >
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-white/5 bg-[#0a0a0a] flex flex-col h-auto md:h-dvh sticky top-0">
        <div className="p-6">
          <Link to="/" className="text-2xl font-medium tracking-tight hover:text-primary transition-colors">Habits</Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-1 mb-8">
            <button
              onClick={() => setActiveView("overview")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                activeView === "overview" ? "bg-primary text-black" : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#E1E0CC]"
              }`}
            >
              Overview
            </button>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-4 mb-3">Your Habits</div>
          <div className="space-y-1">
            {habits.map((habit) => (
              <button
                key={habit.id}
                onClick={() => setActiveView(habit.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeView === habit.id ? "bg-[#1a1a1a] text-primary" : "text-gray-400 hover:bg-[#111] hover:text-[#E1E0CC]"
                }`}
              >
                <span className="text-sm font-medium truncate">{habit.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeView === habit.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                  {habit.current}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="mt-6 px-2">
            <div className="relative">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="New habit..."
                className="w-full bg-[#111] border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/50 transition-colors"
                maxLength={60}
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors">
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-gray-500 hover:text-red-400 transition-colors px-4 py-2 w-full">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-black p-6 md:p-12 lg:p-16">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeView === "overview" ? (
              <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="mb-12">
                  <h1 className="text-3xl md:text-4xl font-medium mb-2 tracking-tight">Today</h1>
                  <p className="text-gray-500">{today}</p>
                </div>

                <div className="bg-[#101010] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl">
                  {habits.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No habits yet. Add one in the sidebar.</p>
                  ) : (
                    <div className="space-y-4">
                      {habits.map(habit => (
                        <div key={habit.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#1a1a1a] border border-white/5 hover:border-primary/20 transition-colors group">
                          <span className={`text-lg font-medium transition-colors ${habit.done ? 'text-gray-500 line-through' : 'text-[#E1E0CC]'}`}>
                            {habit.name}
                          </span>
                          <button
                            onClick={() => handleToggle(habit.id, today)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              habit.done ? 'bg-primary text-black' : 'bg-[#2a2a2a] text-transparent hover:border-primary/50 border border-transparent'
                            }`}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : habits.find(h => h.id === activeView) ? (
              <motion.div key={`habit-${activeView}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                {(() => {
                  const habit = habits.find(h => h.id === activeView)!;
                  return (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                        <div>
                          <h1 className="text-3xl md:text-4xl font-medium mb-2 tracking-tight">{habit.name}</h1>
                          <p className="text-gray-500 text-sm">Tracked since {habit.created_on}</p>
                        </div>
                        <button onClick={() => handleDelete(habit.id)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-950/20 px-4 py-2 rounded-full transition-colors self-start sm:self-auto border border-red-900/30">
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-medium text-primary mb-1">{habit.current}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Current Streak</span>
                        </div>
                        <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-medium text-[#E1E0CC] mb-1">{habit.longest}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Longest Streak</span>
                        </div>
                        <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-medium text-[#E1E0CC] mb-1">{habit.total}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Total Days</span>
                        </div>
                      </div>

                      <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex items-center justify-between mb-8">
                        <span className="text-[#E1E0CC] font-medium">Done today?</span>
                        <button
                          onClick={() => handleToggle(habit.id, today)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            habit.done ? 'bg-primary text-black' : 'bg-[#2a2a2a] text-transparent hover:border-primary/50 border border-transparent'
                          }`}
                        >
                          <Check size={20} />
                        </button>
                      </div>

                      <div className="bg-[#101010] p-6 md:p-8 rounded-3xl border border-white/5 overflow-hidden">
                        <h3 className="text-lg font-medium mb-6 text-[#E1E0CC]">Activity Heatmap</h3>
                        <Heatmap days={habit.days} today={today} />
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}
