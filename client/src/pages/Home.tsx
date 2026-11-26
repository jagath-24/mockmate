import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, ChevronDown, Clock3, Flame, Headphones, LayoutDashboard, LogOut, Mic, MicOff, Play, Plus, RotateCcw, Search, Sparkles, Target, Trophy, UserRound, Volume2, Waves, X } from "lucide-react";
import { toast } from "sonner";
import { QUESTION_BANK } from "@shared/questions";

type View = "home" | "setup" | "interview" | "report" | "progress" | "questions";
type Setup = { role: string; difficulty: string; interviewType: string; questionCount: number };
type InterviewState = { sessionId: number; questionId: number; question: string; category: string; sequence: number; total: number; isFollowup?: boolean };

const roles = ["Java Backend", "Full Stack", "Data Analyst"];
const difficulties = ["Fresher", "Mid-level"];
const interviewTypes = ["Technical", "HR", "System Design basics", "Mixed"];
const questionCounts = [5, 8, 10];

function ScorePill({ value, label }: { value: number; label: string }) {
  return <div className="flex items-center gap-2 rounded-full bg-[#f2eee6] px-3 py-1.5 text-xs font-semibold text-[#536067]"><span className="font-[Space_Grotesk] text-[#ed6a58]">{value}</span><span>{label}</span></div>;
}

function Sidebar({ view, setView, onNew, user }: { view: View; setView: (view: View) => void; onNew: () => void; user: any }) {
  return <aside className="hidden min-h-screen w-[250px] shrink-0 flex-col bg-[#1d3640] px-5 py-6 text-[#eef4f1] lg:flex">
    <div className="flex items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#ed6a58] font-[Space_Grotesk] text-lg font-bold text-white">M</div><div><div className="font-[Space_Grotesk] text-lg font-bold tracking-tight">MockMate</div><div className="text-[10px] uppercase tracking-[.22em] text-[#a8c2bd]">Interview coach</div></div></div>
    <button onClick={onNew} className="mt-9 flex items-center justify-center gap-2 rounded-xl bg-[#ed6a58] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#f47c68] active:scale-[.98]"><Plus size={17} /> New mock interview</button>
    <nav className="mt-10 space-y-2">
      <button onClick={() => setView("home")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${view === "home" || view === "setup" || view === "report" ? "bg-[#294b54] text-white" : "text-[#a8c2bd] hover:bg-[#24434c] hover:text-white"}`}><LayoutDashboard size={17} /> Overview</button>
      <button onClick={() => setView("progress")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${view === "progress" ? "bg-[#294b54] text-white" : "text-[#a8c2bd] hover:bg-[#24434c] hover:text-white"}`}><BarChart3 size={17} /> Progress</button>
      <button onClick={() => setView("questions")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${view === "questions" ? "bg-[#294b54] text-white" : "text-[#a8c2bd] hover:bg-[#24434c] hover:text-white"}`}><Target size={17} /> Question bank</button>
    </nav>
    <div className="mt-auto rounded-2xl border border-[#35545b] bg-[#24434c] p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#f2b584] text-sm font-bold text-[#1d3640]">{user?.name?.slice(0, 1)?.toUpperCase() ?? "A"}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{user?.name ?? "Aarav Mehta"}</div><div className="text-xs text-[#a8c2bd]">Placement track</div></div></div><button onClick={() => user ? undefined : startLogin()} className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#a8c2bd] hover:text-white">{user ? <><LogOut size={14} /> Session ready</> : <><UserRound size={14} /> Sign in to sync</>}</button></div>
  </aside>;
}

function MobileHeader({ onNew }: { onNew: () => void }) {
  return <div className="flex items-center justify-between border-b border-[#dedbd1] bg-[#f7f5ef] px-5 py-4 lg:hidden"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#ed6a58] font-[Space_Grotesk] font-bold text-white">M</div><span className="font-[Space_Grotesk] font-bold">MockMate</span></div><button onClick={onNew} className="rounded-lg bg-[#1d3640] p-2 text-white"><Plus size={17} /></button></div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[.16em] text-[#7a8588]">{label}</span><div className="relative"><select value={value} onChange={event => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-[#dedbd1] bg-[#fffdf8] px-4 py-3.5 text-sm font-semibold text-[#223139] outline-none transition focus:border-[#ed6a58] focus:ring-4 focus:ring-[#ed6a58]/10">{options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7a8588]" size={16} /></div></label>;
}

function HomeDashboard({ onStart, recent, dashboard }: { onStart: () => void; recent: any[]; dashboard: any }) {
  const topicMisses = dashboard?.topicMisses ?? [];
  return <div className="float-in mx-auto max-w-[1220px] px-5 py-8 lg:px-10 lg:py-10"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#ed6a58]">Saturday, 19 September 2026</p><h1 className="font-[Space_Grotesk] text-4xl font-bold tracking-[-.04em] text-[#1d3640] sm:text-5xl">Your next breakthrough<br /><span className="text-[#ed6a58]">starts with one answer.</span></h1><p className="mt-4 max-w-xl text-[15px] leading-7 text-[#6c777b]">Practice the questions that matter for placements. MockMate keeps the pressure real, the feedback honest, and your progress visible.</p></div><button onClick={onStart} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ed6a58] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(237,106,88,.22)] transition hover:-translate-y-0.5 hover:bg-[#f47c68] active:scale-[.98]"><Play size={16} fill="currentColor" /> Start a mock</button></div>
    <div className="mt-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-[#1d3640] p-5 text-[#eef4f1] shadow-[0_12px_28px_rgba(29,54,64,.11)]"><div className="flex items-start justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.14em] text-[#a8c2bd]">Current streak</div><div className="mt-3 font-[Space_Grotesk] text-4xl font-bold">4 <span className="text-base font-medium text-[#a8c2bd]">days</span></div></div><div className="rounded-xl bg-[#294b54] p-2.5 text-[#f2b584]"><Flame size={18} /></div></div><div className="mt-6 h-1.5 rounded-full bg-[#35545b]"><div className="h-full w-[68%] rounded-full bg-[#f2b584]" /></div><div className="mt-2 text-xs text-[#a8c2bd]">2 more to unlock “Steady hand”</div></div><div className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-5 shadow-[0_12px_28px_rgba(29,54,64,.05)]"><div className="flex items-start justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.14em] text-[#7a8588]">Average score</div><div className="mt-3 font-[Space_Grotesk] text-4xl font-bold text-[#1d3640]">{dashboard?.sessions?.length ? "7.4" : "—"}<span className="text-base font-medium text-[#7a8588]"> / 10</span></div></div><div className="rounded-xl bg-[#e5efeb] p-2.5 text-[#427269]"><Trophy size={18} /></div></div><div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#427269]"><span className="rounded-full bg-[#e5efeb] px-2 py-1">+12%</span> from your first session</div></div><div className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-5 shadow-[0_12px_28px_rgba(29,54,64,.05)]"><div className="flex items-start justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.14em] text-[#7a8588]">Sessions completed</div><div className="mt-3 font-[Space_Grotesk] text-4xl font-bold text-[#1d3640]">{dashboard?.sessions?.length ?? 0}</div></div><div className="rounded-xl bg-[#f8e8db] p-2.5 text-[#b86b4d]"><Check size={18} /></div></div><div className="mt-5 text-xs font-semibold text-[#7a8588]">Campus placement track</div></div></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
      <section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 shadow-[0_12px_28px_rgba(29,54,64,.04)]"><div className="flex items-center justify-between"><div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Score trend</h2><p className="mt-1 text-sm text-[#7a8588]">Your last 6 practice sessions</p></div><span className="rounded-full bg-[#e5efeb] px-3 py-1.5 text-xs font-bold text-[#427269]">Trending up</span></div><div className="mt-6 h-[220px]">{recent.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={[{ name: "1", score: 5.8 }, { name: "2", score: 6.2 }, { name: "3", score: 6.8 }, { name: "4", score: 6.6 }, { name: "5", score: 7.4 }, { name: "6", score: 7.8 }]}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ed6a58" stopOpacity={.28} /><stop offset="100%" stopColor="#ed6a58" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eeeae1" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a19f" }} /><YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a19f" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e3dfd5", background: "#fffdf8" }} /><Area type="monotone" dataKey="score" stroke="#ed6a58" strokeWidth={3} fill="url(#scoreFill)" /></AreaChart></ResponsiveContainer> : <div className="grid h-full place-items-center rounded-xl bg-[#f7f5ef] text-center text-sm text-[#7a8588]"><div><Waves className="mx-auto mb-2 text-[#ed6a58]" size={22} /><p>Complete your first mock to see your trend.</p></div></div>}</div></section>
      <section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 shadow-[0_12px_28px_rgba(29,54,64,.04)]"><div className="flex items-center justify-between"><div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Most missed topics</h2><p className="mt-1 text-sm text-[#7a8588]">Where your practice pays off fastest</p></div><Target size={20} className="text-[#ed6a58]" /></div><div className="mt-6 space-y-5">{(topicMisses.length ? topicMisses : [{ category: "SQL & DBMS", avgDepth: 5.7, count: 0 }, { category: "Communication", avgDepth: 6.2, count: 0 }, { category: "System design", avgDepth: 6.8, count: 0 }]).map((item: any, index: number) => <div key={item.category}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-[#405158]">{item.category}</span><span className="text-xs text-[#7a8588]">{Number(item.avgDepth).toFixed(1)} avg</span></div><div className="h-2 rounded-full bg-[#f0ede5]"><div className="h-full rounded-full" style={{ width: `${Math.min(95, Number(item.avgDepth) * 9 + 28)}%`, backgroundColor: ["#ed6a58", "#f2b584", "#8cb6ad"][index % 3] }} /></div></div>)}</div><button onClick={onStart} className="mt-8 flex items-center gap-2 text-sm font-bold text-[#ed6a58] hover:text-[#c65346]">Practice a weak topic <ArrowRight size={15} /></button></section>
    </div>
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Recent sessions</h2><p className="mt-1 text-sm text-[#7a8588]">A little proof that you are showing up.</p></div><button onClick={onStart} className="hidden items-center gap-2 text-sm font-bold text-[#ed6a58] sm:flex">View all <ArrowRight size={15} /></button></div><div className="overflow-hidden rounded-2xl border border-[#e3dfd5] bg-[#fffdf8]">{recent.length ? recent.slice(0, 4).map((item: any, index: number) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[#eeeae1] px-5 py-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e5efeb] text-[#427269]"><BarChart3 size={16} /></div><div className="min-w-0"><div className="truncate text-sm font-bold text-[#35464d]">{item.role} <span className="font-normal text-[#9aa29f]">·</span> {item.interviewType}</div><div className="mt-0.5 text-xs text-[#899391]">{item.difficulty} · {index + 1} {index + 1 === 1 ? "day" : "days"} ago</div></div></div><div className="flex items-center gap-3"><ScorePill value={[7.8, 7.4, 6.9, 8.1][index] ?? 7.4} label="score" /><ArrowRight size={15} className="text-[#a4aaa8]" /></div></div>) : <div className="flex items-center gap-4 px-5 py-6 text-sm text-[#7a8588]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f8e8db] text-[#ed6a58]"><Sparkles size={16} /></div><div><span className="font-semibold text-[#405158]">Your first session is waiting.</span> Answer five questions and get your baseline report.</div><button onClick={onStart} className="ml-auto rounded-lg bg-[#1d3640] px-3 py-2 text-xs font-bold text-white">Begin</button></div>}</div></section>
  </div>;
}

function SetupScreen({ setup, setSetup, onBack, onStart, pending }: { setup: Setup; setSetup: (setup: Setup) => void; onBack: () => void; onStart: () => void; pending: boolean }) {
  return <div className="float-in mx-auto max-w-[980px] px-5 py-8 lg:px-10 lg:py-12"><button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm font-bold text-[#7a8588] hover:text-[#1d3640]"><ArrowLeft size={16} /> Back to overview</button><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#ed6a58]">01 / Set your room</p><h1 className="mt-3 font-[Space_Grotesk] text-4xl font-bold leading-tight tracking-[-.04em] text-[#1d3640]">Make it feel<br /><span className="text-[#ed6a58]">like the real thing.</span></h1><p className="mt-5 max-w-sm text-[15px] leading-7 text-[#6c777b]">Choose your target role and MockMate will tune the questions, pacing, and follow-ups for an Indian campus placement interview.</p><div className="mt-8 flex items-center gap-3 rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5efeb] text-[#427269]"><Sparkles size={18} /></div><div><div className="text-sm font-bold text-[#405158]">Adaptive by design</div><div className="mt-0.5 text-xs leading-5 text-[#7a8588]">A shallow answer earns a thoughtful follow-up.</div></div></div></div><div className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 shadow-[0_16px_32px_rgba(29,54,64,.06)] sm:p-8"><div className="grid gap-6 sm:grid-cols-2"><SelectField label="Target role" value={setup.role} onChange={role => setSetup({ ...setup, role })} options={roles} /><SelectField label="Difficulty" value={setup.difficulty} onChange={difficulty => setSetup({ ...setup, difficulty })} options={difficulties} /></div><div className="mt-7"><span className="mb-3 block text-[11px] font-bold uppercase tracking-[.16em] text-[#7a8588]">Interview type</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{interviewTypes.map(type => <button key={type} onClick={() => setSetup({ ...setup, interviewType: type })} className={`min-h-[62px] rounded-xl border px-3 text-left text-xs font-bold transition ${setup.interviewType === type ? "border-[#ed6a58] bg-[#fff1ec] text-[#b95042]" : "border-[#e3dfd5] bg-[#fffdf8] text-[#68757a] hover:border-[#b8c9c4]"}`}>{type}</button>)}</div></div><div className="mt-7"><span className="mb-3 block text-[11px] font-bold uppercase tracking-[.16em] text-[#7a8588]">Number of questions</span><div className="grid grid-cols-3 gap-2">{questionCounts.map(count => <button key={count} onClick={() => setSetup({ ...setup, questionCount: count })} className={`rounded-xl border py-3.5 text-sm font-bold transition ${setup.questionCount === count ? "border-[#ed6a58] bg-[#fff1ec] text-[#b95042]" : "border-[#e3dfd5] text-[#68757a] hover:border-[#b8c9c4]"}`}>{count}</button>)}</div></div><div className="mt-8 flex items-center justify-between border-t border-[#eeeae1] pt-6"><div className="flex items-center gap-2 text-xs font-semibold text-[#7a8588]"><Clock3 size={15} /> ~{setup.questionCount * 2} min</div><button onClick={onStart} disabled={pending} className="flex items-center gap-2 rounded-xl bg-[#ed6a58] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(237,106,88,.18)] transition hover:bg-[#f47c68] disabled:opacity-60">{pending ? "Preparing room…" : "Enter interview room"} <ArrowRight size={16} /></button></div></div></div></div>;
}

function Avatar({ thinking }: { thinking: boolean }) {
  return <div className={`relative grid h-[72px] w-[72px] place-items-center rounded-full bg-[#1d3640] ${thinking ? "pulse-ring" : ""}`}><div className="absolute inset-2 rounded-full border border-[#6d9490]/50" /><div className="relative h-8 w-8 rounded-[14px] bg-[#d8eee7]"><div className="absolute left-[8px] top-[10px] h-1.5 w-1.5 rounded-full bg-[#1d3640]" /><div className="absolute right-[8px] top-[10px] h-1.5 w-1.5 rounded-full bg-[#1d3640]" /><div className="absolute bottom-[7px] left-[10px] h-1 w-3 rounded-full bg-[#ed6a58]" /></div><div className="absolute -bottom-2 rounded-full border border-[#fffdf8] bg-[#ed6a58] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{thinking ? "thinking" : "live"}</div></div>;
}

function InterviewRoom({ state, onAnswer, pending, onExit }: { state: InterviewState; onAnswer: (answer: string, seconds: number) => void; pending: boolean; onExit: () => void }) {
  const [answer, setAnswer] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  useEffect(() => { setAnswer(""); setSeconds(0); setThinking(false); }, [state.questionId]);
  useEffect(() => { const timer = window.setInterval(() => setSeconds(value => value + 1), 1000); return () => window.clearInterval(timer); }, [state.questionId]);
  const toggleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.info("Speech input is not available here — use the text box instead."); return; }
    if (listening) { setListening(false); return; }
    const recognition = new SpeechRecognition(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-IN";
    recognition.onresult = (event: any) => { const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join(" "); setAnswer(transcript); };
    recognition.onend = () => setListening(false); recognition.onerror = () => setListening(false); recognition.start(); setListening(true);
  };
  const submit = () => { if (!answer.trim() || pending) return; setThinking(true); onAnswer(answer.trim(), seconds); };
  const progress = (state.sequence / state.total) * 100;
  return <div className="min-h-screen bg-[#f7f5ef]"><div className="border-b border-[#dedbd1] bg-[#fffdf8]/80 px-5 py-4 backdrop-blur-md sm:px-8"><div className="mx-auto flex max-w-[1160px] items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1d3640] font-[Space_Grotesk] font-bold text-white">M</div><div><div className="font-[Space_Grotesk] text-sm font-bold text-[#1d3640]">{state.category}</div><div className="text-xs text-[#899391]">{state.isFollowup ? "Adaptive follow-up" : "Core question"}</div></div></div><div className="hidden items-center gap-3 sm:flex"><div className="text-right"><div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899391]">Question</div><div className="font-[Space_Grotesk] text-sm font-bold text-[#1d3640]">{String(state.sequence + 1).padStart(2, "0")} <span className="font-normal text-[#a2aaa7]">/ {String(state.total).padStart(2, "0")}</span></div></div><button onClick={onExit} className="rounded-xl border border-[#e3dfd5] p-2.5 text-[#7a8588] hover:bg-[#f0ede5]"><X size={17} /></button></div></div><div className="mx-auto mt-4 h-1 max-w-[1160px] overflow-hidden rounded-full bg-[#e8e4db]"><div className="h-full rounded-full bg-[#ed6a58] transition-all duration-500" style={{ width: `${Math.max(8, progress)}%` }} /></div></div><main className="mx-auto flex max-w-[860px] flex-col items-center px-5 py-12 sm:py-16"><Avatar thinking={thinking || pending} /><div className="mt-8 text-center"><div className="text-xs font-bold uppercase tracking-[.22em] text-[#ed6a58]">{state.isFollowup ? "Let’s go one layer deeper" : "Take your time"}</div><h1 className="mt-4 font-[Space_Grotesk] text-3xl font-bold leading-tight tracking-[-.03em] text-[#1d3640] sm:text-[42px]">{state.question}</h1></div><div className="mt-10 w-full rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-4 shadow-[0_18px_40px_rgba(29,54,64,.06)]"><div className="flex items-start gap-3"><textarea value={answer} onChange={event => setAnswer(event.target.value)} disabled={thinking || pending} placeholder="Speak your answer, or type it here…" rows={6} className="min-h-[150px] flex-1 resize-none bg-transparent px-2 py-1 text-[15px] leading-7 text-[#35464d] outline-none placeholder:text-[#a2aaa7]" /><button onClick={toggleSpeech} disabled={thinking || pending} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${listening ? "bg-[#ed6a58] text-white" : "bg-[#e5efeb] text-[#427269] hover:bg-[#d4e7e0]"}`} aria-label="Toggle voice input">{listening ? <MicOff size={18} /> : <Mic size={18} />}</button></div><div className="mt-3 flex items-center justify-between border-t border-[#eeeae1] px-2 pt-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#899391]"><Clock3 size={14} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} <span className="mx-1 text-[#dedbd1]">•</span> {listening ? "Listening in English (India)" : "Voice or text"}</div><button onClick={submit} disabled={!answer.trim() || thinking || pending} className="flex items-center gap-2 rounded-xl bg-[#1d3640] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#294b54] disabled:cursor-not-allowed disabled:opacity-40">{pending ? "Evaluating…" : "Submit answer"} <ArrowRight size={15} /></button></div></div><div className="mt-6 flex items-center gap-2 text-xs text-[#899391]"><Headphones size={14} /> Answer as if the interviewer is in the room. No perfect words needed.</div></main></div>;
}

function ReportScreen({ report, onAgain, onHome }: { report: any; onAgain: () => void; onHome: () => void }) {
  if (!report) return <div className="grid min-h-screen place-items-center text-sm text-[#7a8588]">Building your report…</div>;
  return <div className="float-in mx-auto max-w-[1160px] px-5 py-8 lg:px-10 lg:py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><button onClick={onHome} className="mb-5 flex items-center gap-2 text-sm font-bold text-[#7a8588] hover:text-[#1d3640]"><ArrowLeft size={16} /> Overview</button><p className="text-xs font-bold uppercase tracking-[.2em] text-[#ed6a58]">Session complete · {report.session.role}</p><h1 className="mt-3 font-[Space_Grotesk] text-4xl font-bold tracking-[-.04em] text-[#1d3640] sm:text-5xl">Your feedback,<br /><span className="text-[#ed6a58]">without the fluff.</span></h1></div><button onClick={onAgain} className="flex items-center justify-center gap-2 rounded-xl bg-[#ed6a58] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#f47c68]"><RotateCcw size={16} /> Run it again</button></div><div className="mt-10 grid gap-6 xl:grid-cols-[.85fr_1.15fr]"><section className="rounded-2xl bg-[#1d3640] p-6 text-[#eef4f1] shadow-[0_16px_36px_rgba(29,54,64,.12)] sm:p-8"><div className="flex items-start justify-between"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-[#a8c2bd]">Overall score</div><div className="mt-4 font-[Space_Grotesk] text-7xl font-bold tracking-[-.08em] text-white">{report.overall}<span className="text-2xl font-medium tracking-normal text-[#a8c2bd]"> / 10</span></div></div><div className="rounded-xl bg-[#294b54] p-3 text-[#f2b584]"><Trophy size={21} /></div></div><div className="mt-8 grid grid-cols-2 gap-2">{report.skillScores.map((item: any) => <div key={item.skill} className="rounded-xl bg-[#24434c] p-3"><div className="text-[11px] text-[#a8c2bd]">{item.skill}</div><div className="mt-1 font-[Space_Grotesk] text-2xl font-bold text-white">{item.score}<span className="text-xs font-normal text-[#a8c2bd]"> / 10</span></div></div>)}</div><div className="mt-8 flex items-center gap-2 text-xs text-[#a8c2bd]"><Check size={14} className="text-[#f2b584]" /> {report.answered} answers evaluated privately</div></section><section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Skill radar</h2><p className="mt-1 text-sm text-[#7a8588]">A balanced interview is more than correctness.</p></div><Target className="text-[#ed6a58]" size={21} /></div><div className="mt-3 h-[285px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={report.skillScores} cx="50%" cy="50%" outerRadius="68%"><PolarGrid stroke="#e3dfd5" /><PolarAngleAxis dataKey="skill" tick={{ fill: "#68757a", fontSize: 11, fontWeight: 600 }} /><PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#a2aaa7", fontSize: 10 }} axisLine={false} /><Radar name="Score" dataKey="score" stroke="#ed6a58" fill="#ed6a58" fillOpacity={.26} strokeWidth={2} /></RadarChart></ResponsiveContainer></div></section></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5efeb] text-[#427269]"><Sparkles size={17} /></div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">What’s working</h2></div><div className="mt-5 space-y-3">{(report.strengths.length ? report.strengths : ["You completed the full practice loop", "You showed up and started building signal"]).map((strength: string) => <div key={strength} className="flex items-center gap-3 rounded-xl bg-[#f5faf7] px-4 py-3 text-sm font-semibold text-[#42675f]"><Check size={16} /> {strength}</div>)}</div></section><section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1ec] text-[#ed6a58]"><Target size={17} /></div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Next to sharpen</h2></div><div className="mt-5 space-y-3">{(report.weakAreas.length ? report.weakAreas : ["Add more specific examples", "Make your reasoning more explicit"]).map((weak: string) => <div key={weak} className="flex items-center gap-3 rounded-xl bg-[#fff6f1] px-4 py-3 text-sm font-semibold text-[#96594c]"><ArrowRight size={16} /> {weak}</div>)}</div></section></div>{report.poor.length > 0 && <section className="mt-6 rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Model answers to revisit</h2><p className="mt-1 text-sm text-[#7a8588]">Use these as a structure, not a script.</p></div><Volume2 size={20} className="text-[#ed6a58]" /></div><div className="mt-6 space-y-4">{report.poor.slice(0, 3).map((item: any) => <details key={item.question} className="group rounded-xl border border-[#eeeae1] bg-[#fdfbf7] p-4"><summary className="cursor-pointer list-none text-sm font-bold text-[#405158] group-open:text-[#ed6a58]">{item.question}<span className="float-right text-[#a2aaa7]">+</span></summary><div className="mt-4 grid gap-4 border-t border-[#eeeae1] pt-4 text-sm leading-6 text-[#68757a] sm:grid-cols-2"><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#a2aaa7]">Your answer</div>{item.answer}</div><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#ed6a58]">A stronger shape</div>{item.modelAnswer}</div></div></details>)}</div></section>}<section className="mt-6 rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Your 7-day lift plan</h2><p className="mt-1 text-sm text-[#7a8588]">Small reps. Visible progress. One week from now, a different room.</p></div><div className="hidden rounded-xl bg-[#f8e8db] p-3 text-[#b86b4d] sm:block"><Flame size={20} /></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{report.plan.map((item: any, index: number) => <div key={item.day} className={`rounded-xl p-4 ${index === 0 ? "bg-[#1d3640] text-white" : "bg-[#f7f5ef] text-[#405158]"}`}><div className={`text-[10px] font-bold uppercase tracking-[.16em] ${index === 0 ? "text-[#f2b584]" : "text-[#ed6a58]"}`}>{item.day}</div><div className="mt-3 text-sm font-bold">{item.title}</div><div className={`mt-2 text-xs leading-5 ${index === 0 ? "text-[#bdd0c9]" : "text-[#7a8588]"}`}>{item.detail}</div></div>)}</div></section></div>;
}

function ProgressScreen({ onStart, dashboard, recent }: { onStart: () => void; dashboard: any; recent: any[] }) {
  const sessions = dashboard?.sessions ?? [];
  const skillLabels = ["Correctness", "Clarity", "Depth", "Communication"];

  // Build per-session score trend from recent sessions (use mock scores if empty)
  const trendData = recent.length
    ? recent.slice().reverse().map((s: any, i: number) => ({ name: `S${i + 1}`, score: parseFloat(s.overallScore ?? "0") || 0 }))
    : [{ name: "S1", score: 5.8 }, { name: "S2", score: 6.2 }, { name: "S3", score: 6.8 }, { name: "S4", score: 6.6 }, { name: "S5", score: 7.4 }, { name: "S6", score: 7.8 }];

  const radarData = dashboard?.skillAverages?.length
    ? dashboard.skillAverages
    : skillLabels.map((skill, i) => ({ skill, score: [6.8, 7.2, 5.9, 7.5][i] }));

  const topicMisses = dashboard?.topicMisses ?? [];
  const missed = topicMisses.length
    ? topicMisses
    : [{ category: "SQL & DBMS", avgDepth: 5.7 }, { category: "Communication", avgDepth: 6.2 }, { category: "System design", avgDepth: 6.8 }];

  return (
    <div className="float-in mx-auto max-w-[1220px] px-5 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#ed6a58]">Your growth over time</p>
          <h1 className="font-[Space_Grotesk] text-4xl font-bold tracking-[-.04em] text-[#1d3640]">Progress<br /><span className="text-[#ed6a58]">tells the real story.</span></h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#6c777b]">Every session adds signal. Here's what your answers have been saying.</p>
        </div>
        <button onClick={onStart} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ed6a58] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(237,106,88,.22)] transition hover:-translate-y-0.5 hover:bg-[#f47c68] active:scale-[.98]"><Play size={16} fill="currentColor" /> Start a mock</button>
      </div>

      {/* Stats row */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#1d3640] p-5 text-[#eef4f1]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.14em] text-[#a8c2bd]">Sessions done</div>
              <div className="mt-3 font-[Space_Grotesk] text-4xl font-bold">{recent.length}</div>
            </div>
            <div className="rounded-xl bg-[#294b54] p-2.5 text-[#f2b584]"><BarChart3 size={18} /></div>
          </div>
          <div className="mt-5 text-xs text-[#a8c2bd]">{recent.length === 0 ? "Start your first session today" : `Last: ${recent[0]?.role ?? "—"}`}</div>
        </div>
        <div className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.14em] text-[#7a8588]">Best score</div>
              <div className="mt-3 font-[Space_Grotesk] text-4xl font-bold text-[#1d3640]">{recent.length ? Math.max(...trendData.map(d => d.score)).toFixed(1) : "—"}<span className="text-base font-medium text-[#7a8588]"> / 10</span></div>
            </div>
            <div className="rounded-xl bg-[#f8e8db] p-2.5 text-[#b86b4d]"><Trophy size={18} /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.14em] text-[#7a8588]">Average score</div>
              <div className="mt-3 font-[Space_Grotesk] text-4xl font-bold text-[#1d3640]">{recent.length ? (trendData.reduce((s, d) => s + d.score, 0) / trendData.length).toFixed(1) : "—"}<span className="text-base font-medium text-[#7a8588]"> / 10</span></div>
            </div>
            <div className="rounded-xl bg-[#e5efeb] p-2.5 text-[#427269]"><Target size={18} /></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 shadow-[0_12px_28px_rgba(29,54,64,.04)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Score trend</h2>
              <p className="mt-1 text-sm text-[#7a8588]">All your sessions, oldest to newest</p>
            </div>
            <span className="rounded-full bg-[#e5efeb] px-3 py-1.5 text-xs font-bold text-[#427269]">{recent.length} sessions</span>
          </div>
          <div className="mt-6 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="progFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ed6a58" stopOpacity={.28} />
                    <stop offset="100%" stopColor="#ed6a58" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eeeae1" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a19f" }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a19f" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e3dfd5", background: "#fffdf8" }} />
                <Area type="monotone" dataKey="score" stroke="#ed6a58" strokeWidth={3} fill="url(#progFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 shadow-[0_12px_28px_rgba(29,54,64,.04)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Skill radar</h2>
              <p className="mt-1 text-sm text-[#7a8588]">Across all sessions</p>
            </div>
            <Target size={20} className="text-[#ed6a58]" />
          </div>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke="#e3dfd5" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#68757a", fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#a2aaa7", fontSize: 10 }} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#ed6a58" fill="#ed6a58" fillOpacity={.26} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Weak topics */}
      <section className="mt-8 rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] p-6 shadow-[0_12px_28px_rgba(29,54,64,.04)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">Weak areas to work on</h2>
            <p className="mt-1 text-sm text-[#7a8588]">Topics where your average depth was lowest</p>
          </div>
          <button onClick={onStart} className="flex items-center gap-2 text-sm font-bold text-[#ed6a58] hover:text-[#c65346]">Practice now <ArrowRight size={15} /></button>
        </div>
        <div className="space-y-5">
          {missed.map((item: any, index: number) => (
            <div key={item.category}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#405158]">{item.category}</span>
                <span className="text-xs text-[#7a8588]">{Number(item.avgDepth).toFixed(1)} avg depth</span>
              </div>
              <div className="h-2 rounded-full bg-[#f0ede5]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(95, Number(item.avgDepth) * 9 + 10)}%`, backgroundColor: ["#ed6a58", "#f2b584", "#8cb6ad"][index % 3] }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Session list */}
      <section className="mt-8">
        <h2 className="mb-4 font-[Space_Grotesk] text-xl font-bold text-[#1d3640]">All sessions</h2>
        <div className="overflow-hidden rounded-2xl border border-[#e3dfd5] bg-[#fffdf8]">
          {recent.length ? recent.map((item: any, index: number) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[#eeeae1] px-5 py-4 last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e5efeb] text-[#427269]"><BarChart3 size={16} /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[#35464d]">{item.role} <span className="font-normal text-[#9aa29f]">·</span> {item.interviewType}</div>
                  <div className="mt-0.5 text-xs text-[#899391]">{item.difficulty} · {item.questionCount} questions</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-[#f2eee6] px-3 py-1.5 text-xs font-semibold text-[#536067]">
                  <span className="font-[Space_Grotesk] text-[#ed6a58]">{item.overallScore ?? "—"}</span><span>score</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex items-center gap-4 px-5 py-6 text-sm text-[#7a8588]">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f8e8db] text-[#ed6a58]"><Sparkles size={16} /></div>
              <div><span className="font-semibold text-[#405158]">No sessions yet.</span> Complete your first mock to start tracking.</div>
              <button onClick={onStart} className="ml-auto rounded-lg bg-[#1d3640] px-3 py-2 text-xs font-bold text-white">Begin</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function QuestionBankScreen({ onStart }: { onStart: () => void }) {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("All");
  const [activeType, setActiveType] = useState("All");

  const allRoles = ["All", "Java Backend", "Full Stack", "Data Analyst"];
  const allTypes = ["All", "Technical", "HR", "System Design basics", "Mixed"];

  const categoryColors: Record<string, string> = {
    "REST & API design": "bg-[#e5efeb] text-[#427269]",
    "OOPs": "bg-[#f8e8db] text-[#b86b4d]",
    "SQL & DBMS": "bg-[#e8e4f7] text-[#5a4fa0]",
    "Spring Boot": "bg-[#fff1ec] text-[#b95042]",
    "Operating Systems": "bg-[#f2eee6] text-[#8a6d3b]",
    "React basics": "bg-[#e5f2fb] text-[#2b7cb3]",
    "HR & communication": "bg-[#f0faf4] text-[#2d6a4f]",
    "Data thinking": "bg-[#faf0f8] text-[#8e3a7f]",
    "Behavioral": "bg-[#fdfbeb] text-[#856404]",
  };

  const filtered = QUESTION_BANK.filter(q => {
    const matchRole = activeRole === "All" || q.roles.includes(activeRole);
    const matchType = activeType === "All" || q.types.includes(activeType);
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchType && matchSearch;
  });

  const categories = [...new Set(filtered.map(q => q.category))];

  return (
    <div className="float-in mx-auto max-w-[1220px] px-5 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#ed6a58]">Practice catalog</p>
          <h1 className="font-[Space_Grotesk] text-4xl font-bold tracking-[-.04em] text-[#1d3640]">Question bank<br /><span className="text-[#ed6a58]">know what's coming.</span></h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#6c777b]">{QUESTION_BANK.length} questions across {[...new Set(QUESTION_BANK.map(q => q.category))].length} categories. Filter to your track and study them before you're asked.</p>
        </div>
        <button onClick={onStart} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ed6a58] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(237,106,88,.22)] transition hover:-translate-y-0.5 hover:bg-[#f47c68] active:scale-[.98]"><Play size={16} fill="currentColor" /> Start a mock</button>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a2aaa7]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or categories…"
            className="w-full rounded-xl border border-[#e3dfd5] bg-[#fffdf8] py-3 pl-9 pr-4 text-sm text-[#35464d] outline-none transition focus:border-[#ed6a58] focus:ring-4 focus:ring-[#ed6a58]/10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {allRoles.map(role => (
            <button key={role} onClick={() => setActiveRole(role)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeRole === role ? "bg-[#1d3640] text-white" : "bg-[#f0ede5] text-[#536067] hover:bg-[#e3dfd5]"}`}>{role}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTypes.map(type => (
            <button key={type} onClick={() => setActiveType(type)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeType === type ? "bg-[#ed6a58] text-white" : "bg-[#f0ede5] text-[#536067] hover:bg-[#e3dfd5]"}`}>{type}</button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[#7a8588]">
        <span>{filtered.length} questions</span>
        <span className="text-[#dedbd1]">·</span>
        <span>{categories.length} categories</span>
        {(search || activeRole !== "All" || activeType !== "All") && (
          <button onClick={() => { setSearch(""); setActiveRole("All"); setActiveType("All"); }} className="ml-2 rounded-full bg-[#f0ede5] px-2 py-0.5 text-[#536067] hover:bg-[#e3dfd5]">Clear filters ×</button>
        )}
      </div>

      {/* Question list by category */}
      {categories.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border border-[#e3dfd5] bg-[#fffdf8] py-16 text-center">
          <BookOpen size={28} className="mb-3 text-[#c8c4b8]" />
          <p className="font-semibold text-[#7a8588]">No questions match your filters.</p>
          <button onClick={() => { setSearch(""); setActiveRole("All"); setActiveType("All"); }} className="mt-3 text-sm font-bold text-[#ed6a58] hover:underline">Clear filters</button>
        </div>
      ) : categories.map(category => (
        <section key={category} className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${categoryColors[category] ?? "bg-[#f0ede5] text-[#536067]"}`}>{category}</span>
            <span className="text-xs text-[#a2aaa7]">{filtered.filter(q => q.category === category).length} questions</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e3dfd5] bg-[#fffdf8]">
            {filtered.filter(q => q.category === category).map((q, i, arr) => (
              <div key={q.text} className={`px-5 py-4 ${i < arr.length - 1 ? "border-b border-[#eeeae1]" : ""}`}>
                <p className="text-sm font-semibold leading-6 text-[#35464d]">{q.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.roles.map(r => <span key={r} className="rounded-full bg-[#f0ede5] px-2 py-0.5 text-[10px] font-bold text-[#68757a]">{r}</span>)}
                  {q.types.map(t => <span key={t} className="rounded-full bg-[#fff1ec] px-2 py-0.5 text-[10px] font-bold text-[#b95042]">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("home");
  const [setup, setSetup] = useState<Setup>({ role: "Java Backend", difficulty: "Fresher", interviewType: "Mixed", questionCount: 5 });
  const [interview, setInterview] = useState<InterviewState | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const recent = trpc.interviews.recent.useQuery();
  const dashboard = trpc.interviews.dashboard.useQuery();
  const create = trpc.interviews.create.useMutation({ onError: error => toast.error(error.message) });
  const answer = trpc.interviews.answer.useMutation({ onError: error => toast.error(error.message) });
  const reportInput = useMemo(() => ({ id: reportId ?? 0 }), [reportId]);
  const report = trpc.interviews.report.useQuery(reportInput, { enabled: reportId !== null, refetchOnWindowFocus: false });
  const beginSetup = () => { setView("setup"); setReportId(null); };
  const startInterview = () => create.mutate(setup, { onSuccess: result => { setInterview(result); setView("interview"); } });
  const submitAnswer = (answerText: string, timeSpentSeconds: number) => {
    if (!interview) return;
    answer.mutate({ sessionId: interview.sessionId, questionId: interview.questionId, answerText, timeSpentSeconds }, { onSuccess: result => { if (result.done) { setReportId(interview.sessionId); setView("report"); recent.refetch(); dashboard.refetch(); } else if (result.nextQuestion) setInterview({ sessionId: interview.sessionId, ...result.nextQuestion }); } });
  };
  return <div className="grain min-h-screen bg-[#f7f5ef]"><div className="flex min-h-screen"><Sidebar view={view} setView={setView} onNew={beginSetup} user={user} /><div className="min-w-0 flex-1"><MobileHeader onNew={beginSetup} />{view === "home" && <HomeDashboard onStart={beginSetup} recent={recent.data ?? []} dashboard={dashboard.data} />}{view === "setup" && <SetupScreen setup={setup} setSetup={setSetup} onBack={() => setView("home")} onStart={startInterview} pending={create.isPending} />}{view === "interview" && interview && <InterviewRoom state={interview} onAnswer={submitAnswer} pending={answer.isPending} onExit={() => setView("home")} />}{view === "report" && <ReportScreen report={report.data} onAgain={beginSetup} onHome={() => setView("home")} />}{view === "progress" && <ProgressScreen onStart={beginSetup} dashboard={dashboard.data} recent={recent.data ?? []} />}{view === "questions" && <QuestionBankScreen onStart={beginSetup} />}</div></div></div>;
}
