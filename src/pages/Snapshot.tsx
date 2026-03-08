import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, RotateCcw, Copy, Check, Wand2, Loader2, Briefcase, TrendingUp, GraduationCap, MapPin, Target, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Rocket, DollarSign, Clock, Lightbulb, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_RESPONSES, DEMO_SKILLS, DEMO_CAREERS, DEMO_JOBS, DEMO_VENTURES } from "@/data/demoData";

const sectionMeta = [
  { label: "What I've Built", icon: "🔨", description: "Projects, creations, and impact" },
  { label: "My Go-To Strengths", icon: "⚡", description: "What people trust me with" },
  { label: "Resilience Story", icon: "🔥", description: "Challenges overcome, lessons learned" },
];

interface Skill {
  name: string;
  evidence: string;
}

interface Career {
  title: string;
  soc_code: string;
  match_reason: string;
  salary_range: string;
  growth: string;
  bright_outlook: boolean;
  education: string;
}

interface SkillGap {
  name: string;
  difficulty: "easy" | "moderate" | "intensive";
  action: string;
}

interface Job {
  title: string;
  company_type: string;
  location: string;
  salary_range: string;
  soc_code: string;
  match_percentage: number;
  skills_matched: string[];
  skill_gaps: SkillGap[];
  why_youre_ready: string;
}

interface Venture {
  name: string;
  pitch: string;
  model: string;
  startup_cost: string;
  time_to_revenue: string;
  readiness_percentage: number;
  skills_matched: string[];
  skill_gaps: SkillGap[];
  first_steps: string[];
  why_youre_ready: string;
}

type PathTrack = "jobs" | "entrepreneur";

const difficultyConfig = {
  easy: { label: "Quick Win", color: "text-success", bg: "bg-success/15" },
  moderate: { label: "1-3 Months", color: "text-warning", bg: "bg-warning/15" },
  intensive: { label: "3-6+ Months", color: "text-destructive", bg: "bg-destructive/15" },
};

const Snapshot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const isDemoFromState = Boolean((location.state as { demo?: boolean } | null)?.demo);
  const [isDemoMode, setIsDemoMode] = useState(
    isDemo || isDemoFromState || localStorage.getItem("skillSignalDemo") === "true"
  );
  const [responses, setResponses] = useState<string[]>(isDemoMode ? DEMO_RESPONSES : []);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loadingVentures, setLoadingVentures] = useState(false);
  const [expandedVenture, setExpandedVenture] = useState<number | null>(null);
  const [activeTrack, setActiveTrack] = useState<PathTrack>("jobs");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleCreateProfile = async () => {
    const { firstName, lastName, email, password } = profileForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setRegistering(true);
    try {
      // Step 1: Register
      const regRes = await fetch("https://diversai-platform-beta.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, userType: "job_seeker" }),
      });
      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok) throw new Error(regData.message || `Registration failed (${regRes.status})`);

      // Step 2: Submit assessment data
      const token = regData?.token || regData?.accessToken || regData?.session?.access_token;
      const profileHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token) profileHeaders["Authorization"] = `Bearer ${token}`;

      try {
        await fetch("https://diversai-platform-beta.onrender.com/api/onboarding/smart-profile/complete", {
          method: "POST",
          headers: profileHeaders,
          credentials: "include",
          body: JSON.stringify({ finalFormData: { skills, careers, jobs, ventures, responses } }),
        });
      } catch (e) {
        console.error("Smart profile submission failed:", e);
      }

      localStorage.setItem("skilllingo_assessment", JSON.stringify({ skills, careers, jobs, ventures, responses }));
      toast.success("Profile created! Redirecting to DiversAI login...");
      setTimeout(() => {
        window.location.href = `https://www.diversai.co/login?email=${encodeURIComponent(email)}`;
      }, 1000);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    const demoFlag = localStorage.getItem("skillSignalDemo") === "true";
    const shouldUseDemo = isDemo || isDemoFromState || demoFlag;

    if (shouldUseDemo) {
      setIsDemoMode(true);
      localStorage.setItem("skillSignalDemo", "true");
      localStorage.setItem("skillSignalResponses", JSON.stringify(DEMO_RESPONSES));
      setResponses(DEMO_RESPONSES);
      return;
    }

    const stored = localStorage.getItem("skillSignalResponses");
    if (!stored) {
      navigate("/prompts");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const hasContent = Array.isArray(parsed) && parsed.some((item) => String(item).trim().length > 0);
      if (Array.isArray(parsed) && parsed.length === 3 && hasContent) {
        setResponses(parsed);
      } else {
        navigate("/prompts");
      }
    } catch {
      navigate("/prompts");
    }
  }, [navigate, isDemo, isDemoFromState]);

  const handleCopy = async () => {
    let text = sectionMeta
      .map((s, i) => `${s.icon} ${s.label}\n${responses[i] || ""}`)
      .join("\n\n---\n\n");

    if (skills.length > 0) {
      text += "\n\n---\n\n🎯 Top Skills\n" + skills.map((s) => `• ${s.name} — ${s.evidence}`).join("\n");
    }

    if (careers.length > 0) {
      text += "\n\n---\n\n💼 Suggested Career Paths\n" + careers.map((c) => `• ${c.title} (${c.soc_code}) — ${c.salary_range} | ${c.growth}`).join("\n");
    }

    if (jobs.length > 0) {
      text += "\n\n---\n\n🎯 Job Matches & Skill Gap Analysis\n" + jobs.map((j) => `• ${j.title} at ${j.company_type} (${j.match_percentage}% match) — ${j.salary_range}\n  Skills matched: ${j.skills_matched.join(", ")}\n  Gaps: ${j.skill_gaps.map(g => `${g.name} (${g.difficulty})`).join(", ")}`).join("\n");
    }

    if (ventures.length > 0) {
      text += "\n\n---\n\n🚀 Entrepreneur Track\n" + ventures.map((v) => `• ${v.name} (${v.readiness_percentage}% ready) — ${v.model} | ${v.startup_cost}\n  ${v.pitch}\n  First steps: ${v.first_steps.join("; ")}`).join("\n");
    }

    await navigator.clipboard.writeText(`✨ My Skill Snapshot\n\n${text}`);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExtractSkills = async () => {
    setExtracting(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      setSkills(DEMO_SKILLS);
      toast.success("Skills extracted! You're making real progress.");
      setExtracting(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("extract-skills", {
        body: { responses },
      });
      if (error) throw error;
      if (data?.skills) {
        setSkills(data.skills);
        toast.success("Skills extracted! You're making real progress.");
      } else {
        throw new Error("No skills returned");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Something went wrong, but your work is safe. Let's try again.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSuggestCareers = async () => {
    setLoadingCareers(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      setCareers(DEMO_CAREERS);
      toast.success("Career paths identified!");
      setLoadingCareers(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("suggest-careers", {
        body: { skills },
      });
      if (error) throw error;
      if (data?.careers) {
        setCareers(data.careers);
        toast.success("Career paths identified!");
      } else {
        throw new Error("No careers returned");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Something went wrong. Let's try again.");
    } finally {
      setLoadingCareers(false);
    }
  };

  const handleMatchJobs = async () => {
    setLoadingJobs(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      setJobs(DEMO_JOBS);
      toast.success("Crushed it. Your job matches are live.");
      setLoadingJobs(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("match-jobs", {
        body: { skills, careers },
      });
      if (error) throw error;
      if (data?.jobs) {
        setJobs(data.jobs);
        toast.success("Crushed it. Your job matches are live.");
      } else {
        throw new Error("No jobs returned");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Something went wrong — but you've got this. Try again.");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleMatchVentures = async () => {
    setLoadingVentures(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      setVentures(DEMO_VENTURES);
      toast.success("Your venture ideas are ready. Time to build.");
      setLoadingVentures(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("match-ventures", {
        body: { skills, careers },
      });
      if (error) throw error;
      if (data?.ventures) {
        setVentures(data.ventures);
        toast.success("Your venture ideas are ready. Time to build.");
      } else {
        throw new Error("No ventures returned");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Something went wrong — but you've got this. Try again.");
    } finally {
      setLoadingVentures(false);
    }
  };

  const handleLoadTrack = (track: PathTrack) => {
    setActiveTrack(track);
    if (track === "jobs" && jobs.length === 0 && !loadingJobs) {
      handleMatchJobs();
    } else if (track === "entrepreneur" && ventures.length === 0 && !loadingVentures) {
      handleMatchVentures();
    }
  };

  if (responses.length === 0) return null;

  const hasPathData = jobs.length > 0 || ventures.length > 0;
  const showPathSection = careers.length > 0 && (hasPathData || loadingJobs || loadingVentures);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 14 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="text-xs font-bold tracking-widest uppercase text-accent">Your Skill Snapshot</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Done. You're making real progress.</h1>
            <p className="text-muted-foreground text-lg mb-10">Here's your skills and experience, reframed and ready to share.</p>
          </motion.div>

          {/* Reflection responses */}
          <div className="space-y-6">
            {sectionMeta.map((section, index) => (
              <motion.div
                key={section.label}
                className="p-6 md:p-8 rounded-2xl bg-card border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.15, duration: 0.5 }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{section.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{section.label}</h3>
                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{section.description}</p>
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{responses[index]}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Extract Skills CTA */}
          {skills.length === 0 && (
            <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <Button
                onClick={handleExtractSkills}
                disabled={extracting}
                className="w-full bg-gradient-primary text-primary-foreground font-semibold px-6 py-6 rounded-xl hover:scale-[1.02] transition-transform duration-200 text-base glow-primary disabled:opacity-60 disabled:hover:scale-100"
              >
                {extracting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing your experience...</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" />Translate My Experience Into Skills</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">AI will identify 5–10 workforce-ready skills from your responses</p>
            </motion.div>
          )}

          {/* Skills Display */}
          <AnimatePresence>
            {skills.length > 0 && (
              <motion.div className="mt-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 14 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your Top Skills</h2>
                    <p className="text-xs text-muted-foreground">Extracted from your lived experience</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {skills.map((skill, i) => (
                    <motion.div
                      key={skill.name}
                      className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-accent mt-1 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <h4 className="font-bold text-foreground mb-1">{skill.name}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{skill.evidence}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button onClick={handleExtractSkills} variant="ghost" disabled={extracting} className="mt-4 text-muted-foreground hover:text-foreground">
                  {extracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Re-analyze
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Career Suggestions CTA */}
          {skills.length > 0 && careers.length === 0 && (
            <motion.div className="mt-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Button
                onClick={handleSuggestCareers}
                disabled={loadingCareers}
                className="w-full bg-card border-2 border-accent/40 text-foreground font-semibold px-6 py-6 rounded-xl hover:border-accent hover:scale-[1.02] transition-all duration-200 text-base glow-accent disabled:opacity-60 disabled:hover:scale-100"
              >
                {loadingCareers ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Finding career matches...</>
                ) : (
                  <><Briefcase className="w-5 h-5 mr-2" />Discover Career Paths for My Skills</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">AI will suggest careers aligned with your skills using O*NET occupational data</p>
            </motion.div>
          )}

          {/* Career Suggestions Display */}
          <AnimatePresence>
            {careers.length > 0 && (
              <motion.div className="mt-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 14 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Career Paths For You</h2>
                    <p className="text-xs text-muted-foreground">Based on O*NET occupational data</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {careers.map((career, i) => (
                    <motion.div
                      key={career.soc_code}
                      className="p-5 md:p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors duration-200"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h4 className="font-bold text-foreground text-lg">{career.title}</h4>
                          <span className="text-xs text-muted-foreground font-mono">{career.soc_code}</span>
                        </div>
                        {career.bright_outlook && (
                          <span className="shrink-0 px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-bold">
                            ☀️ Bright Outlook
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{career.match_reason}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <TrendingUp className="w-3.5 h-3.5 text-accent" />
                          <span>{career.salary_range}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Briefcase className="w-3.5 h-3.5 text-primary" />
                          <span>{career.growth}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="w-3.5 h-3.5 text-success" />
                          <span>{career.education}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button onClick={handleSuggestCareers} variant="ghost" disabled={loadingCareers} className="mt-4 text-muted-foreground hover:text-foreground">
                  {loadingCareers ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Re-analyze careers
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Path CTA — Choose Your Track */}
          {careers.length > 0 && !hasPathData && !loadingJobs && !loadingVentures && (
            <motion.div className="mt-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-sm font-semibold text-foreground text-center mb-4">Choose your path</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleLoadTrack("jobs")}
                  disabled={loadingJobs}
                  className="bg-card border-2 border-primary/40 text-foreground font-semibold px-4 py-6 rounded-xl hover:border-primary hover:scale-[1.02] transition-all duration-200 text-sm glow-primary disabled:opacity-60 disabled:hover:scale-100 flex flex-col gap-1 h-auto"
                >
                  <Target className="w-5 h-5" />
                  <span>Find Jobs</span>
                  <span className="text-xs text-muted-foreground font-normal">5 real job matches</span>
                </Button>
                <Button
                  onClick={() => handleLoadTrack("entrepreneur")}
                  disabled={loadingVentures}
                  className="bg-card border-2 border-accent/40 text-foreground font-semibold px-4 py-6 rounded-xl hover:border-accent hover:scale-[1.02] transition-all duration-200 text-sm glow-accent disabled:opacity-60 disabled:hover:scale-100 flex flex-col gap-1 h-auto"
                >
                  <Rocket className="w-5 h-5" />
                  <span>Start a Venture</span>
                  <span className="text-xs text-muted-foreground font-normal">5 business ideas</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">With skill gap analysis — pick one or explore both</p>
            </motion.div>
          )}

          {/* Track Tabs + Content */}
          {showPathSection && (
            <motion.div className="mt-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 14 }}>
              {/* Tab switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 mb-6">
                <button
                  onClick={() => {
                    setActiveTrack("jobs");
                    if (jobs.length === 0 && !loadingJobs) handleMatchJobs();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTrack === "jobs"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Jobs
                  {jobs.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold">{jobs.length}</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTrack("entrepreneur");
                    if (ventures.length === 0 && !loadingVentures) handleMatchVentures();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTrack === "entrepreneur"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  Entrepreneur
                  {ventures.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-bold">{ventures.length}</span>
                  )}
                </button>
              </div>

              {/* Jobs Track */}
              <AnimatePresence mode="wait">
                {activeTrack === "jobs" && (
                  <motion.div key="jobs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                    {loadingJobs && (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Finding real job matches...
                      </div>
                    )}

                    {!loadingJobs && jobs.length > 0 && (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground">With skill gap analysis — here's your roadmap</p>
                        </div>

                        <div className="grid gap-4">
                          {jobs.map((job, i) => {
                            const isExpanded = expandedJob === i;
                            return (
                              <motion.div
                                key={`${job.title}-${i}`}
                                className="rounded-xl bg-card border border-border overflow-hidden hover:border-primary/20 transition-colors duration-200"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                              >
                                <button onClick={() => setExpandedJob(isExpanded ? null : i)} className="w-full p-5 md:p-6 text-left">
                                  <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-foreground text-lg">{job.title}</h4>
                                      <p className="text-sm text-muted-foreground">{job.company_type}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="relative w-12 h-12">
                                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                                          <circle
                                            cx="18" cy="18" r="15.5" fill="none"
                                            stroke={job.match_percentage >= 75 ? "hsl(var(--success))" : job.match_percentage >= 50 ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                                            strokeWidth="3"
                                            strokeDasharray={`${(job.match_percentage / 100) * 97.4} 97.4`}
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{job.match_percentage}%</span>
                                      </div>
                                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span>{job.location}</span></div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="w-3.5 h-3.5 text-accent" /><span>{job.salary_range}</span></div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="w-3.5 h-3.5 text-primary" /><span className="font-mono">{job.soc_code}</span></div>
                                  </div>

                                  <p className="text-sm text-primary mt-3 italic">&quot;{job.why_youre_ready}&quot;</p>
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                      <div className="px-5 md:px-6 pb-6 border-t border-border pt-5 space-y-5">
                                        <div>
                                          <h5 className="text-xs font-bold tracking-widest uppercase text-success mb-3 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" />Skills You Already Have</h5>
                                          <div className="flex flex-wrap gap-2">
                                            {job.skills_matched.map((skill) => (
                                              <span key={skill} className="px-3 py-1.5 rounded-full bg-success/15 text-success text-xs font-medium">{skill}</span>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <h5 className="text-xs font-bold tracking-widest uppercase text-warning mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />Skills To Develop</h5>
                                          <div className="space-y-3">
                                            {job.skill_gaps.map((gap) => {
                                              const config = difficultyConfig[gap.difficulty] || difficultyConfig.moderate;
                                              return (
                                                <div key={gap.name} className="p-4 rounded-lg bg-secondary/50 border border-border">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-foreground text-sm">{gap.name}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>{config.label}</span>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground leading-relaxed">→ {gap.action}</p>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>

                        <Button onClick={handleMatchJobs} variant="ghost" disabled={loadingJobs} className="mt-4 text-muted-foreground hover:text-foreground">
                          {loadingJobs ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                          Re-analyze jobs
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Entrepreneur Track */}
                {activeTrack === "entrepreneur" && (
                  <motion.div key="entrepreneur" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    {loadingVentures && (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating venture ideas...
                      </div>
                    )}

                    {!loadingVentures && ventures.length > 0 && (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                            <Rocket className="w-3.5 h-3.5 text-accent-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground">Venture ideas with skill gaps & first steps to launch</p>
                        </div>

                        <div className="grid gap-4">
                          {ventures.map((venture, i) => {
                            const isExpanded = expandedVenture === i;
                            return (
                              <motion.div
                                key={`${venture.name}-${i}`}
                                className="rounded-xl bg-card border border-border overflow-hidden hover:border-accent/20 transition-colors duration-200"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                              >
                                <button onClick={() => setExpandedVenture(isExpanded ? null : i)} className="w-full p-5 md:p-6 text-left">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-foreground text-lg">{venture.name}</h4>
                                      <p className="text-sm text-muted-foreground mt-1">{venture.pitch}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="relative w-12 h-12">
                                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                                          <circle
                                            cx="18" cy="18" r="15.5" fill="none"
                                            stroke={venture.readiness_percentage >= 75 ? "hsl(var(--success))" : venture.readiness_percentage >= 50 ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                                            strokeWidth="3"
                                            strokeDasharray={`${(venture.readiness_percentage / 100) * 97.4} 97.4`}
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{venture.readiness_percentage}%</span>
                                      </div>
                                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3 text-xs mt-3">
                                    <div className="flex items-center gap-1.5 text-muted-foreground"><Lightbulb className="w-3.5 h-3.5 text-accent" /><span>{venture.model}</span></div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground"><DollarSign className="w-3.5 h-3.5 text-success" /><span>{venture.startup_cost}</span></div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5 text-primary" /><span>{venture.time_to_revenue}</span></div>
                                  </div>

                                  <p className="text-sm text-accent mt-3 italic">&quot;{venture.why_youre_ready}&quot;</p>
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                      <div className="px-5 md:px-6 pb-6 border-t border-border pt-5 space-y-5">
                                        {/* Skills matched */}
                                        <div>
                                          <h5 className="text-xs font-bold tracking-widest uppercase text-success mb-3 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" />Skills You Already Have</h5>
                                          <div className="flex flex-wrap gap-2">
                                            {venture.skills_matched.map((skill) => (
                                              <span key={skill} className="px-3 py-1.5 rounded-full bg-success/15 text-success text-xs font-medium">{skill}</span>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Skill gaps */}
                                        <div>
                                          <h5 className="text-xs font-bold tracking-widest uppercase text-warning mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />Skills To Develop</h5>
                                          <div className="space-y-3">
                                            {venture.skill_gaps.map((gap) => {
                                              const config = difficultyConfig[gap.difficulty] || difficultyConfig.moderate;
                                              return (
                                                <div key={gap.name} className="p-4 rounded-lg bg-secondary/50 border border-border">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-foreground text-sm">{gap.name}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>{config.label}</span>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground leading-relaxed">→ {gap.action}</p>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* First steps */}
                                        <div>
                                          <h5 className="text-xs font-bold tracking-widest uppercase text-primary mb-3 flex items-center gap-2"><Rocket className="w-3.5 h-3.5" />First Steps to Launch</h5>
                                          <div className="space-y-2">
                                            {venture.first_steps.map((step, si) => (
                                              <div key={si} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                                <span className="text-xs font-bold text-primary mt-0.5 shrink-0">{si + 1}.</span>
                                                <p className="text-sm text-foreground/90">{step}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>

                        <Button onClick={handleMatchVentures} variant="ghost" disabled={loadingVentures} className="mt-4 text-muted-foreground hover:text-foreground">
                          {loadingVentures ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                          Re-analyze ventures
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Create DiversAI Profile CTA */}
          {skills.length > 0 && (
            <motion.div className="mt-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Button
                onClick={() => setShowProfileModal(true)}
                className="w-full bg-gradient-to-r from-accent to-primary text-primary-foreground font-semibold px-6 py-6 rounded-xl hover:scale-[1.02] transition-transform duration-200 text-base"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create My DiversAI Profile
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">Take your skills assessment to DiversAI and get matched with opportunities</p>
            </motion.div>
          )}

          {/* DiversAI Registration Modal */}
          <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Your DiversAI Profile</DialogTitle>
                <DialogDescription>Your skills assessment will be linked to your new profile.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="First name" value={profileForm.firstName} onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Last name" value={profileForm.lastName} onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={profileForm.password} onChange={(e) => setProfileForm(p => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleCreateProfile} disabled={registering} className="w-full bg-gradient-primary text-primary-foreground font-semibold py-5 rounded-xl">
                  {registering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Profile...</> : <>Create Profile & Go to DiversAI</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <motion.div className="flex flex-col sm:flex-row items-center gap-4 mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Button onClick={handleCopy} className="bg-gradient-primary text-primary-foreground font-semibold px-6 py-5 rounded-xl hover:scale-105 transition-transform duration-200 w-full sm:w-auto">
              {copied ? <><Check className="w-4 h-4 mr-2" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Snapshot</>}
            </Button>
            <Button variant="outline" onClick={() => navigate("/prompts")} className="border-border text-foreground rounded-xl py-5 w-full sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />Redo Prompts
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />Home
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Snapshot;
