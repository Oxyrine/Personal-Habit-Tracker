import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LogOut,
  Plus,
  Trash2,
  Check,
  X,
  BookOpen,
  Dumbbell,
  Footprints,
  Brain,
  Droplet,
  Moon,
  PenLine,
  Code2,
  Utensils,
  Music,
  Languages,
  Flame,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Heatmap from "../components/Heatmap";
import type { AuthUser } from "../App";
import { usePageMeta } from "../hooks/usePageMeta";

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

const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatLong = (iso: string) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";

const formatShort = (iso: string) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";

// No icon picker in the UI, no schema change -- just infer something sensible from
// the name so the list isn't all identical dots. Falls back to a flame (streak).
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/read|book|study/i, BookOpen],
  [/exercise|gym|workout|fitness|lift|strength|yoga/i, Dumbbell],
  [/run|jog|walk|steps|hike/i, Footprints],
  [/meditat|mindful|breath/i, Brain],
  [/water|hydrat|drink/i, Droplet],
  [/sleep|rest|bed/i, Moon],
  [/write|journal|diary/i, PenLine],
  [/code|program|dev/i, Code2],
  [/eat|diet|nutrition|cook|meal/i, Utensils],
  [/music|instrument|guitar|piano|practice/i, Music],
  [/language|learn|vocab/i, Languages],
];

const habitIcon = (name: string): LucideIcon => ICON_RULES.find(([re]) => re.test(name))?.[1] ?? Flame;

export default function Dashboard({ user }: { user: AuthUser | null }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState<string>("");
  const [newHabitName, setNewHabitName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

  const { habitId } = useParams<{ habitId?: string }>();
  const navigate = useNavigate();
  const newHabitInputRef = useRef<HTMLInputElement>(null);

  const selectedId = habitId ? Number(habitId) : null;
  const selectedHabit = selectedId !== null ? habits.find((h) => h.id === selectedId) : undefined;

  usePageMeta(
    selectedHabit ? `${selectedHabit.name} — Habits` : "Dashboard — Habits",
    "Track your daily habits and streaks."
  );

  const loadHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load habits");
      const data = await res.json();
      setHabits(data.habits || []);
      setToday(data.today || "");
    } catch {
      setError("Couldn't load your habits. Try refreshing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // A habitId in the URL that doesn't match any habit (bad link, deleted elsewhere) bounces to Overview.
  useEffect(() => {
    if (!isLoading && selectedId !== null && !selectedHabit) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, selectedId, selectedHabit, navigate]);

  const handleToggle = async (habitId: number, day: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const wasDone = habit.days.includes(day);

    setHabits((current) =>
      current.map((h) => {
        if (h.id !== habitId) return h;
        const newDays = wasDone ? h.days.filter((d) => d !== day) : [...h.days, day];
        return { ...h, done: day === today ? !wasDone : h.done, days: newDays };
      })
    );

    try {
      const res = await fetch("/api/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId, day }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    } catch {
      setError("Couldn't save that check-in. Try again.");
    } finally {
      loadHabits(); // Reload for accurate streaks, and to roll back on failure.
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHabitName }),
      });
      if (!res.ok) throw new Error("Add failed");
      setNewHabitName("");
      loadHabits();
    } catch {
      setError("Couldn't add that habit. Try again.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/habits/${id}/delete`, { method: "POST" });
      if (!res.ok) throw new Error("Delete failed");
      setConfirmingDeleteId(null);
      if (selectedId === id) navigate("/dashboard");
      loadHabits();
    } catch {
      setError("Couldn't delete that habit. Try again.");
      setConfirmingDeleteId(null);
    }
  };

  const handleRename = async (id: number, name: string) => {
    const trimmed = name.trim();
    setRenamingId(null);
    const original = habits.find((h) => h.id === id)?.name;
    if (!trimmed || trimmed === original) return;

    setHabits((current) => current.map((h) => (h.id === id ? { ...h, name: trimmed } : h)));
    try {
      const res = await fetch(`/api/habits/${id}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Rename failed");
    } catch {
      setError("Couldn't rename that habit. Try again.");
      loadHabits();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "Escape" && selectedId !== null && !isTyping) {
        navigate("/dashboard");
        return;
      }
      if (isTyping || selectedId !== null) return;

      if (/^[1-9]$/.test(e.key)) {
        const habit = habits[Number(e.key) - 1];
        if (habit) handleToggle(habit.id, today);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        newHabitInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, selectedId, today, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center text-primary">
        <LoaderCircle className="animate-spin" size={28} />
      </div>
    );
  }

  const doneCount = habits.filter((h) => h.done).length;
  const atRisk = habits.filter((h) => h.current > 0 && !h.done);

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
              onClick={() => navigate("/dashboard")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                selectedId === null ? "bg-primary text-black" : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#E1E0CC]"
              }`}
            >
              Overview
            </button>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-4 mb-3">Your Habits</div>
          <div className="space-y-1">
            {habits.map((habit) => {
              const Icon = habitIcon(habit.name);
              return (
                <button
                  key={habit.id}
                  onClick={() => navigate(`/dashboard/${habit.id}`)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                    selectedId === habit.id ? "bg-[#1a1a1a] text-primary" : "text-gray-400 hover:bg-[#111] hover:text-[#E1E0CC]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon size={15} className="shrink-0" />
                    <span className="text-sm font-medium truncate">{habit.name}</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${selectedId === habit.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                    {habit.current}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAdd} className="mt-6 px-2">
            <div className="relative">
              <input
                ref={newHabitInputRef}
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

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto bg-black p-6 md:p-12 lg:p-16 focus:outline-none">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-950/30 text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-900/30 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200 shrink-0">
                <X size={16} />
              </button>
            </div>
          )}

          {/* popLayout, not wait: an exiting view must never be able to block the
              entering one from appearing if a frame never lands (e.g. the tab loses
              focus mid-transition) — pop the exiting clone out of flow instead. */}
          <AnimatePresence mode="popLayout">
            {selectedId === null ? (
              <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="mb-10">
                  <p className="text-gray-500 text-sm mb-1">
                    {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
                  </p>
                  <h1 className="text-3xl md:text-4xl font-medium mb-2 tracking-tight">Today</h1>
                  <p className="text-gray-500">{formatLong(today)}</p>
                </div>

                {habits.length > 0 && (
                  <div className="bg-[#101010] border border-white/5 rounded-3xl p-6 mb-6 flex items-center justify-between gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Today's progress</p>
                      <p className="text-2xl font-medium text-[#E1E0CC]">{doneCount} of {habits.length} complete</p>
                    </div>
                    <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden shrink-0">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${habits.length ? (doneCount / habits.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {atRisk.length > 0 && (
                  <div className="bg-red-950/10 border border-red-900/20 rounded-3xl p-6 mb-6">
                    <p className="text-sm text-red-400 font-medium mb-3">Streaks at risk today</p>
                    <div className="flex flex-wrap gap-2">
                      {atRisk.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => handleToggle(h.id, today)}
                          className="text-sm bg-red-950/20 hover:bg-red-950/30 text-red-300 px-3 py-1.5 rounded-full border border-red-900/30 transition-colors"
                        >
                          {h.name} · {h.current} day{h.current === 1 ? "" : "s"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#101010] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl">
                  {habits.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No habits yet. Add one in the sidebar.</p>
                  ) : (
                    <div className="space-y-4">
                      {habits.map((habit, i) => {
                        const Icon = habitIcon(habit.name);
                        return (
                          <div key={habit.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#1a1a1a] border border-white/5 hover:border-primary/20 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                              {i < 9 && <span className="text-[10px] text-gray-600 w-3 shrink-0">{i + 1}</span>}
                              <Icon size={18} className={`shrink-0 ${habit.done ? 'text-gray-600' : 'text-primary/70'}`} />
                              <span className={`text-lg font-medium transition-colors truncate ${habit.done ? 'text-gray-500 line-through' : 'text-[#E1E0CC]'}`}>
                                {habit.name}
                              </span>
                              {habit.current > 0 && <span className="text-xs text-gray-500 shrink-0">{habit.current}d streak</span>}
                            </div>
                            <button
                              onClick={() => handleToggle(habit.id, today)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                                habit.done ? 'bg-primary text-black' : 'bg-[#2a2a2a] text-transparent hover:border-primary/50 border border-transparent'
                              }`}
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {habits.length > 0 && (
                  <p className="text-xs text-gray-600 mt-4">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">9</kbd> to check off a habit, <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">N</kbd> to add one
                  </p>
                )}
              </motion.div>
            ) : selectedHabit ? (
              <motion.div key={`habit-${selectedHabit.id}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                  <div className="min-w-0 flex-1">
                    {renamingId === selectedHabit.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleRename(selectedHabit.id, renameValue); }}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => setRenamingId(null)}
                          onKeyDown={(e) => { if (e.key === "Escape") setRenamingId(null); }}
                          maxLength={60}
                          className="text-3xl md:text-4xl font-medium mb-2 tracking-tight bg-transparent border-b border-primary/40 focus:outline-none text-[#E1E0CC] w-full"
                        />
                      </form>
                    ) : (
                      <h1
                        onClick={() => { setRenamingId(selectedHabit.id); setRenameValue(selectedHabit.name); }}
                        title="Click to rename"
                        className="text-3xl md:text-4xl font-medium mb-2 tracking-tight cursor-text hover:text-primary/90 transition-colors truncate"
                      >
                        {selectedHabit.name}
                      </h1>
                    )}
                    <p className="text-gray-500 text-sm">Tracked since {formatShort(selectedHabit.created_on)}</p>
                  </div>

                  {confirmingDeleteId === selectedHabit.id ? (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="text-sm text-gray-500 whitespace-nowrap">Delete forever?</span>
                      <button
                        onClick={() => handleDelete(selectedHabit.id)}
                        className="text-sm text-red-400 hover:text-red-300 bg-red-950/20 px-4 py-2 rounded-full transition-colors border border-red-900/30 whitespace-nowrap"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="text-sm text-gray-400 hover:text-[#E1E0CC] px-4 py-2 rounded-full transition-colors border border-white/10 whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeleteId(selectedHabit.id)}
                      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-950/20 px-4 py-2 rounded-full transition-colors self-start sm:self-auto border border-red-900/30 shrink-0"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-medium text-primary mb-1">{selectedHabit.current}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Current Streak</span>
                  </div>
                  <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-medium text-[#E1E0CC] mb-1">{selectedHabit.longest}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Longest Streak</span>
                  </div>
                  <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-medium text-[#E1E0CC] mb-1">{selectedHabit.total}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Total Days</span>
                  </div>
                </div>

                <div className="bg-[#101010] p-6 rounded-3xl border border-white/5 flex items-center justify-between mb-8">
                  <span className="text-[#E1E0CC] font-medium">Done today?</span>
                  <button
                    onClick={() => handleToggle(selectedHabit.id, today)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedHabit.done ? 'bg-primary text-black' : 'bg-[#2a2a2a] text-transparent hover:border-primary/50 border border-transparent'
                    }`}
                  >
                    <Check size={20} />
                  </button>
                </div>

                <div className="bg-[#101010] p-6 md:p-8 rounded-3xl border border-white/5 overflow-hidden">
                  <h3 className="text-lg font-medium mb-6 text-[#E1E0CC]">Activity Heatmap</h3>
                  <Heatmap
                    days={selectedHabit.days}
                    today={today}
                    createdOn={selectedHabit.created_on}
                    onToggleDay={(iso) => handleToggle(selectedHabit.id, iso)}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}
