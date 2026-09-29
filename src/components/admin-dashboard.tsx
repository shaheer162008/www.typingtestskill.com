"use client";

import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { AlertCircle, BarChart3, Check, ChevronRight, Clock, Edit2, Eye, Inbox, Keyboard, Layers3, LayoutDashboard, LogOut, Mail, MessageSquare, Plus, Search, ShieldCheck, TrendingUp, Trash2, Type, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase-client";
import Image from "next/image";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────── */
type Lesson = { id: string; title: string; text: string; mode: "test" | "practice" | "words"; difficulty?: string | null; wordCount?: number | null; createdAt: number };
type ContactMessage = { id: string; name: string; email: string; subject: string; message: string; seen: boolean; createdAt?: { toDate?: () => Date } | number };
type UserRecord = { id: string; name?: string; email?: string; role?: string; createdAt?: number; photoURL?: string };
type TestResult = { createdAt?: number; rawWpm?: number; accuracy?: number; reviewStatus?: string };

function timeAgo(ts: ContactMessage["createdAt"]) {
  let d: Date | null = null;
  if (typeof ts === "number") d = new Date(ts);
  else if (ts?.toDate) d = ts.toDate();
  if (!d) return "just now";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fullDate(ts: ContactMessage["createdAt"]) {
  if (typeof ts === "number") return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (ts?.toDate) return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return "—";
}

/* ─── Components ─────────────────────────────────────────────────── */
function CustomSelect({ value, onChange, options }: { value: any, onChange: (v: any) => void, options: {label: string, value: any}[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-xl text-white text-[14px] outline-none focus:border-white/[0.15] transition-colors">
        <span>{options.find(o => o.value === value)?.label || "Select..."}</span>
        <ChevronRight className={`w-4 h-4 text-primary/40 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl shadow-black z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(225,224,204,0.1) transparent" }}>
          <div className="p-1.5 flex flex-col gap-1">
            {options.map(opt => (
              <button 
                key={opt.value} 
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${value === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-white/70 hover:bg-white/[0.04] hover:text-white'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [now, setNow] = useState(0);
  
  // Lesson Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonText, setLessonText] = useState("");
  const [selectedLessonMode, setSelectedLessonMode] = useState<"test" | "practice" | "words">("test");
  const [selectedDifficulty, setSelectedDifficulty] = useState("beginner");
  const [selectedWordCount, setSelectedWordCount] = useState(25);
  
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [lessonFilter, setLessonFilter] = useState<"all" | "test" | "practice" | "words">("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => { if (!user) return; void user.getIdTokenResult(true).then((t) => { setIsAdmin(t.claims.admin === true); setIsSuperAdmin(t.claims.superAdmin === true || t.claims.role === "super_admin"); }); }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubs = [
      onSnapshot(collection(db, "lessons"), (s) => setLessons(s.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson)).sort((a, b) => b.createdAt - a.createdAt))),
      onSnapshot(query(collection(db, "contactMessages"), orderBy("createdAt", "desc")), (s) => setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() } as ContactMessage)))),
      onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() } as UserRecord)))),
      onSnapshot(collection(db, "testResults"), (s) => setResults(s.docs.map((d) => d.data() as TestResult))),
    ];
    return () => unsubs.forEach((u) => u());
  }, [isAdmin]);

  useEffect(() => { const u = () => setNow(Date.now()); u(); const t = setInterval(u, 60_000); return () => clearInterval(t); }, []);

  const stats = useMemo(() => {
    const day = 86_400_000;
    const cnt = (d: number) => results.filter((r) => now > 0 && typeof r.createdAt === "number" && now - r.createdAt < d * day).length;
    const avg = results.length ? Math.round(results.reduce((a, r) => a + (r.rawWpm ?? 0), 0) / results.length) : 0;
    return { total: results.length, daily: cnt(1), weekly: cnt(7), monthly: cnt(30), unread: messages.filter((m) => !m.seen).length, avgWpm: avg };
  }, [messages, now, results]);

  const filteredLessons = lessonFilter === "all" ? lessons : lessons.filter((l) => l.mode === lessonFilter);
  const filteredUsers = userSearch ? users.filter((u) => (u.name?.toLowerCase() ?? "").includes(userSearch.toLowerCase()) || (u.email?.toLowerCase() ?? "").includes(userSearch.toLowerCase())) : users;

  const showNotice = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(null), 3500); };

  const openAddModal = () => {
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonText("");
    setSelectedLessonMode("test");
    setSelectedDifficulty("beginner");
    setSelectedWordCount(25);
    setIsAddModalOpen(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonText(lesson.text);
    setSelectedLessonMode(lesson.mode);
    setSelectedDifficulty(lesson.difficulty || "beginner");
    setSelectedWordCount(lesson.wordCount || 25);
    setIsAddModalOpen(true);
  };

  const saveLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lessonTitle.trim() || !lessonText.trim()) return;
    
    // Process text: restrict word count if mode is words
    let processedText = lessonText.trim();
    if (selectedLessonMode === "words") {
      const words = processedText.split(/\s+/).filter(w => w.length > 0);
      if (words.length > selectedWordCount) {
        processedText = words.slice(0, selectedWordCount).join(" ");
      }
    }

    const payload = {
      title: lessonTitle.trim(), 
      text: processedText, 
      mode: selectedLessonMode, 
      difficulty: selectedLessonMode !== "words" ? selectedDifficulty : null, 
      wordCount: selectedLessonMode === "words" ? selectedWordCount : null,
    };

    if (editingLessonId) {
      await updateDoc(doc(db, "lessons", editingLessonId), payload);
      showNotice("Lesson updated successfully.");
    } else {
      await addDoc(collection(db, "lessons"), { ...payload, createdAt: Date.now() });
      showNotice("Lesson created successfully.");
    }
    
    setIsAddModalOpen(false);
  };

  const removeLesson = async (id: string) => { if (!confirm("Delete this lesson permanently?")) return; await deleteDoc(doc(db, "lessons", id)); showNotice("Lesson deleted."); };
  const markSeen = async (m: ContactMessage) => { await updateDoc(doc(db, "contactMessages", m.id), { seen: true, seenAt: serverTimestamp() }); };
  const deleteMessage = async (id: string) => { if (!confirm("Delete this message?")) return; await deleteDoc(doc(db, "contactMessages", id)); };
  const changeRole = async (r: UserRecord, role: string) => { if (!user || !isSuperAdmin) return showNotice("Only super admins can change roles."); const t = await user.getIdToken(); const res = await fetch(`/api/admin/users/${r.id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ role }) }); showNotice(res.ok ? "Role updated." : "Update failed."); };

  /* ─── Guards ────────────────────────────────────────────────────── */
  if (loading) return <div className="flex h-screen items-center justify-center bg-[#060606]"><div className="flex flex-col items-center gap-4"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /><p className="text-sm text-primary/50">Loading admin console…</p></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-[#060606]"><div className="text-center"><ShieldCheck className="mx-auto h-12 w-12 text-primary/30 mb-4" /><p className="text-primary/60">Sign in with an admin account to continue.</p><Link href="/login" className="mt-4 inline-block text-sm text-primary underline underline-offset-4">Go to login →</Link></div></div>;
  if (!isAdmin) return <div className="flex h-screen items-center justify-center bg-[#060606]"><div className="text-center max-w-sm"><AlertCircle className="mx-auto h-12 w-12 text-red-400/60 mb-4" /><h2 className="text-xl font-bold text-white mb-2">Access Denied</h2><p className="text-sm text-primary/50 leading-relaxed">Your account does not have administrative privileges. Contact a super admin to request access.</p><Link href="/" className="mt-6 inline-block text-sm text-primary underline underline-offset-4">Return home →</Link></div></div>;

  const tabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { id: "lessons", label: "Lessons", icon: Layers3, badge: lessons.length },
    { id: "inbox", label: "Messages", icon: Inbox, badge: stats.unread },
    { id: "users", label: "Users", icon: Users, badge: users.length },
  ];

  const modeIcon = (mode: string) => {
    if (mode === "test") return <Keyboard className="w-3.5 h-3.5" />;
    if (mode === "practice") return <Type className="w-3.5 h-3.5" />;
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  const modeColor = (mode: string) => {
    if (mode === "test") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (mode === "practice") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    return "text-sky-400 bg-sky-400/10 border-sky-400/20";
  };

  return (
    <div className="flex h-screen bg-[#060606] text-primary overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`${sidebarCollapsed ? "w-[72px]" : "w-[260px]"} flex flex-col border-r border-white/[0.06] bg-[#0a0a0a] transition-all duration-300 z-10`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[72px] border-b border-white/[0.06] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Keyboard className="w-4 h-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[15px] font-semibold text-white tracking-tight truncate">Admin Panel</p>
              <p className="text-[10px] text-primary/40 uppercase tracking-[0.15em]">Typing Test Skill</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className={`px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/30 ${sidebarCollapsed ? "text-center" : ""}`}>{sidebarCollapsed ? "•" : "Navigation"}</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} gap-3 px-3 py-2.5 text-[13px] rounded-xl transition-all duration-200 ${isActive ? "bg-white/[0.08] text-white font-medium" : "text-primary/50 hover:bg-white/[0.04] hover:text-primary/80"}`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${tab.id === "inbox" && stats.unread > 0 ? "bg-red-500/20 text-red-400" : "bg-white/[0.06] text-primary/40"}`}>
                        {tab.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-white/[0.06] p-3">
          <div className={`flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden shrink-0 ring-2 ring-white/[0.06]">
              {user.photoURL ? <Image src={user.photoURL} alt="" width={32} height={32} className="w-full h-full object-cover" /> : user.email?.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{user.displayName ?? user.email?.split("@")[0]}</p>
                <p className="text-[10px] text-primary/40">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button onClick={() => void logout()} className="p-1.5 text-primary/30 hover:text-primary/70 transition-colors rounded-lg hover:bg-white/[0.04]" title="Sign out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#060606]">
        {/* Toast */}
        {notice && (
          <div className="absolute top-5 right-5 z-50" style={{ animation: "slideDown 0.3s ease-out, fadeOut 0.3s ease-in 3s forwards" }}>
            <div className="bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl shadow-emerald-500/20 text-sm font-medium flex items-center gap-2.5">
              <Check className="w-4 h-4" /> {notice}
            </div>
          </div>
        )}

        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 h-[72px] border-b border-white/[0.06] shrink-0 bg-[#060606]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-white/[0.04] text-primary/40 hover:text-primary/70 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="2" rx="1" fill="currentColor"/><rect x="2" y="8" width="10" height="2" rx="1" fill="currentColor"/><rect x="2" y="13" width="14" height="2" rx="1" fill="currentColor"/></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-primary/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(225,224,204,0.1) transparent" }}>

          {/* ─── OVERVIEW ──────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-8 max-w-6xl">
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-8">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10">
                  <p className="text-sm text-primary/50">Welcome back,</p>
                  <h2 className="text-2xl font-bold text-white mt-1">{user.displayName ?? user.email?.split("@")[0]} 👋</h2>
                  <p className="text-sm text-primary/40 mt-2 max-w-lg">Here&apos;s what&apos;s happening with your typing platform today.</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: users.length, icon: Users, trend: `+${stats.daily} today`, color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-400", borderColor: "border-violet-500/10" },
                  { label: "Total Tests", value: stats.total, icon: BarChart3, trend: `${stats.weekly} this week`, color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400", borderColor: "border-blue-500/10" },
                  { label: "Active Lessons", value: lessons.length, icon: Layers3, trend: `${lessons.filter(l=>l.mode==="test").length} tests`, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400", borderColor: "border-emerald-500/10" },
                  { label: "Avg WPM", value: stats.avgWpm, icon: TrendingUp, trend: "across all tests", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400", borderColor: "border-amber-500/10" },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className={`group relative rounded-2xl border ${s.borderColor} bg-[#0a0a0a] p-6 transition-all duration-300 hover:border-white/[0.1] hover:-translate-y-0.5`}>
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className={`p-2.5 rounded-xl bg-white/[0.04] ${s.iconColor}`}><Icon className="w-4 h-4" /></div>
                          <ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-primary/40 transition-colors" />
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{s.value}</p>
                        <p className="text-[13px] text-primary/50 mt-1">{s.label}</p>
                        <p className="text-[11px] text-primary/30 mt-3 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" /> {s.trend}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Grid */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Recent Messages */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Mail className="w-4 h-4 text-primary/40" /> Recent Messages</h3>
                    <button onClick={() => setActiveTab("inbox")} className="text-[11px] text-primary/40 hover:text-primary transition-colors">View all →</button>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {messages.slice(0, 4).map((m) => (
                      <div key={m.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${m.seen ? "bg-primary/20" : "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white truncate">{m.subject}</p>
                          <p className="text-[11px] text-primary/40 truncate">{m.name}</p>
                        </div>
                        <p className="text-[10px] text-primary/30 shrink-0">{timeAgo(m.createdAt)}</p>
                      </div>
                    ))}
                    {messages.length === 0 && <div className="px-6 py-8 text-center text-[13px] text-primary/30">No messages yet</div>}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-primary/40" /> Quick Actions</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[
                      { label: "Add Lesson", icon: Plus, action: () => { setActiveTab("lessons"); setTimeout(() => openAddModal(), 100); } },
                      { label: "View Users", icon: Users, action: () => setActiveTab("users") },
                      { label: "Check Inbox", icon: Inbox, action: () => setActiveTab("inbox") },
                      { label: "Go to Site", icon: Eye, action: () => window.open("/", "_blank") },
                    ].map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <button key={i} onClick={a.action} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-[13px] text-primary/60 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.1] transition-all duration-200">
                          <Icon className="w-4 h-4" /> {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── LESSONS ───────────────────────────────────────── */}
          {activeTab === "lessons" && (
            <div className="space-y-6 max-w-6xl">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-xl border border-white/[0.06] p-1">
                  {(["all", "test", "practice", "words"] as const).map((f) => (
                    <button key={f} onClick={() => setLessonFilter(f)} className={`px-3.5 py-1.5 text-[12px] rounded-lg capitalize transition-all ${lessonFilter === f ? "bg-white/[0.08] text-white font-medium" : "text-primary/40 hover:text-primary/70"}`}>
                      {f === "all" ? `All (${lessons.length})` : `${f} (${lessons.filter(l => l.mode === f).length})`}
                    </button>
                  ))}
                </div>
                <button onClick={openAddModal} className="group flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-primary transition-colors shadow-lg shadow-white/5">
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" /> Add Lesson
                </button>
              </div>

              {/* Lesson Cards Grid */}
              {filteredLessons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0a0a0a] p-16 text-center">
                  <Layers3 className="w-10 h-10 text-primary/15 mx-auto mb-4" />
                  <p className="text-primary/40 text-sm">No lessons found. Create your first lesson to get started.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredLessons.map((lesson, idx) => (
                    <div key={lesson.id} className="group rounded-xl border border-white/[0.06] bg-[#0a0a0a] hover:bg-white/[0.02] hover:border-white/[0.1] transition-all duration-200 overflow-hidden">
                      <div className="flex items-center gap-5 px-6 py-4">
                        {/* Index */}
                        <span className="text-[12px] text-primary/20 font-mono w-6 text-center shrink-0">{String(idx + 1).padStart(2, "0")}</span>

                        {/* Mode Badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium shrink-0 ${modeColor(lesson.mode)}`}>
                          {modeIcon(lesson.mode)}
                          <span className="capitalize">{lesson.mode}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-white truncate">{lesson.title}</p>
                          <p className="text-[12px] text-primary/35 truncate mt-0.5">{lesson.text.substring(0, 80)}…</p>
                        </div>

                        {/* Config Tag */}
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                          {(lesson.mode === "test" || lesson.mode === "practice") && lesson.difficulty && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-400/5 text-amber-400/70 text-[11px] capitalize border border-amber-400/10">{lesson.difficulty}</span>
                          )}
                          {lesson.mode === "words" && lesson.wordCount && (
                            <span className="px-2.5 py-1 rounded-lg bg-sky-400/5 text-sky-400/70 text-[11px] border border-sky-400/10">{lesson.wordCount}w</span>
                          )}
                          <span className="text-[11px] text-primary/25 font-mono">{lesson.text.length.toLocaleString()} chars</span>
                        </div>

                        {/* Date */}
                        <span className="hidden md:block text-[11px] text-primary/25 shrink-0">{new Date(lesson.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(lesson)} className="p-2 rounded-lg text-primary/30 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeLesson(lesson.id)} className="p-2 rounded-lg text-primary/30 hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── INBOX ─────────────────────────────────────────── */}
          {activeTab === "inbox" && (
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-primary/40">{messages.length} total · {stats.unread} unread</p>
              </div>

              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0a0a0a] p-16 text-center">
                  <Inbox className="w-10 h-10 text-primary/15 mx-auto mb-4" />
                  <p className="text-primary/40 text-sm">Your inbox is empty.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`rounded-xl border transition-all duration-200 overflow-hidden ${msg.seen ? "border-white/[0.04] bg-[#0a0a0a]" : "border-primary/15 bg-primary/[0.02]"}`}>
                      <button type="button" onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)} className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${msg.seen ? "bg-primary/15" : "bg-primary"}`} />
                        <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center text-primary/50 text-xs font-bold shrink-0 uppercase">{msg.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-[13px] truncate ${msg.seen ? "text-primary/60" : "text-white font-medium"}`}>{msg.subject}</p>
                          </div>
                          <p className="text-[11px] text-primary/35 truncate">{msg.name} · {msg.email}</p>
                        </div>
                        <span className="text-[11px] text-primary/25 shrink-0">{timeAgo(msg.createdAt)}</span>
                        <ChevronRight className={`w-4 h-4 text-primary/20 shrink-0 transition-transform ${expandedMessage === msg.id ? "rotate-90" : ""}`} />
                      </button>

                      {expandedMessage === msg.id && (
                        <div className="px-6 pb-5 pt-1 border-t border-white/[0.04] ml-[60px]">
                          <p className="text-[13px] text-primary/70 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.04]">
                            <span className="text-[11px] text-primary/30">{fullDate(msg.createdAt)}</span>
                            <div className="flex-1" />
                            {!msg.seen && (
                              <button onClick={(e) => { e.stopPropagation(); void markSeen(msg); }} className="text-[12px] text-primary/60 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                                Mark read
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); void deleteMessage(msg.id); }} className="text-[12px] text-red-400/60 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-400/5 transition-colors">
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── USERS ─────────────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="space-y-6 max-w-5xl">
              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users by name or email..." className="w-full bg-[#0a0a0a] border border-white/[0.06] pl-11 pr-4 py-2.5 rounded-xl text-[13px] text-white outline-none focus:border-white/[0.15] transition-colors placeholder:text-primary/25" />
              </div>

              {/* User List */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_120px] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] text-primary/30 uppercase tracking-[0.1em] font-medium">
                  <span>User</span>
                  <span>Email</span>
                  <span className="text-right">Role</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {filteredUsers.map((record) => (
                    <div key={record.id} className="grid grid-cols-[1fr_1fr_120px] gap-4 items-center px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center text-primary/60 text-[11px] font-bold overflow-hidden shrink-0 ring-1 ring-white/[0.06]">
                          {record.photoURL ? <Image src={record.photoURL} alt="" width={32} height={32} className="w-full h-full object-cover" /> : (record.name ? record.name.charAt(0).toUpperCase() : "U")}
                        </div>
                        <span className="text-[13px] font-medium text-white truncate">{record.name || "Unnamed User"}</span>
                      </div>
                      <span className="text-[13px] text-primary/45 truncate">{record.email}</span>
                      <div className="text-right">
                        {isSuperAdmin ? (
                          <div className="w-24 ml-auto">
                            <CustomSelect 
                              value={record.role ?? "user"} 
                              onChange={(v) => changeRole(record, v)} 
                              options={[
                                { label: "User", value: "user" },
                                { label: "Super Admin", value: "super_admin" }
                              ]} 
                            />
                          </div>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${record.role === "super_admin" ? "bg-primary/10 text-primary" : "bg-white/[0.04] text-primary/40"}`}>
                            {record.role === "super_admin" ? "Super Admin" : "User"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="px-6 py-12 text-center text-[13px] text-primary/30">No users found.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Create/Edit Lesson Modal ─────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-[#0c0c0c] border border-white/[0.08] w-full max-w-xl rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh]" style={{ animation: "scaleIn 0.2s ease-out" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-white">{editingLessonId ? "Edit Lesson" : "Create Lesson"}</h3>
                <p className="text-[12px] text-primary/40 mt-0.5">{editingLessonId ? "Update existing lesson details" : "Add a new typing lesson to your platform"}</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl text-primary/30 hover:text-primary hover:bg-white/[0.04] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form id="lessonForm" onSubmit={saveLesson} className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(225,224,204,0.1) transparent" }}>
              <div className="relative z-0">
                <label className="block text-[13px] font-medium text-white mb-2">Title</label>
                <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. The Quick Brown Fox" className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-xl text-white text-[14px] outline-none focus:border-white/[0.15] transition-colors placeholder:text-primary/20" autoFocus />
              </div>

              {/* Mode + Config */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative z-[3]">
                  <label className="block text-[13px] font-medium text-white mb-2">Type</label>
                  <CustomSelect 
                    value={selectedLessonMode} 
                    onChange={(v) => setSelectedLessonMode(v)} 
                    options={[
                      { label: "Typing Test", value: "test" },
                      { label: "Typing Practice", value: "practice" },
                      { label: "Word Typing", value: "words" }
                    ]} 
                  />
                </div>

                {selectedLessonMode !== "words" && (
                  <div className="relative z-[2]">
                    <label className="block text-[13px] font-medium text-white mb-2">Difficulty</label>
                    <CustomSelect 
                      value={selectedDifficulty} 
                      onChange={(v) => setSelectedDifficulty(v)} 
                      options={[
                        { label: "Beginner", value: "beginner" },
                        { label: "Intermediate", value: "intermediate" },
                        { label: "Advanced", value: "advanced" },
                        { label: "Pro", value: "pro" }
                      ]} 
                    />
                  </div>
                )}

                {selectedLessonMode === "words" && (
                  <div className="relative z-[2]">
                    <label className="block text-[13px] font-medium text-white mb-2">Word Count</label>
                    <CustomSelect 
                      value={selectedWordCount} 
                      onChange={(v) => setSelectedWordCount(v)} 
                      options={[25, 50, 75, 100, 125, 150].map(n => ({ label: `${n} words`, value: n }))} 
                    />
                  </div>
                )}
              </div>

              <div className="relative z-0">
                <label className="block text-[13px] font-medium text-white mb-2">Paragraph Text</label>
                <textarea value={lessonText} onChange={(e) => setLessonText(e.target.value)} placeholder="Enter the text for users to type... (Press Enter for new lines)" rows={7} className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-xl text-white text-[14px] outline-none focus:border-white/[0.15] transition-colors resize-none leading-relaxed placeholder:text-primary/20" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(225,224,204,0.1) transparent" }} />
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-primary/40">
                    {lessonText.length} characters · {lessonText.split(/\s+/).filter((w) => w.length > 0).length} words
                    {selectedLessonMode === "words" && (
                      <span className="ml-1 text-sky-400/80">
                        (Text will be auto-trimmed to {selectedWordCount} words on save)
                      </span>
                    )}
                  </p>
                  {lessonText.length > 0 && lessonText.length < 50 && selectedLessonMode !== "words" && <p className="text-[11px] text-amber-400/60">Consider adding more text for a better experience</p>}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] text-primary/50 hover:text-primary hover:bg-white/[0.04] transition-colors">
                Cancel
              </button>
              <button type="submit" form="lessonForm" disabled={!lessonTitle.trim() || !lessonText.trim()} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-white text-black hover:bg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                {editingLessonId ? "Save Changes" : "Create Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
