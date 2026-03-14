import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BarChart3, GraduationCap, UserPlus, ArrowRight, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useSkills, CategorizedSkill } from "@/lib/skillsContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  technical: "Technical Skills",
  soft: "Soft Skills",
  tools: "Tools & Platforms",
  domain: "Domain Knowledge",
};

const categoryColors: Record<string, string> = {
  technical: "bg-accent/15 text-accent",
  soft: "bg-secondary text-lavender-foreground",
  tools: "bg-primary/10 text-primary",
  domain: "bg-warning/15 text-warning-foreground",
};

const confidenceLabel: Record<string, string> = {
  high: "●●●",
  medium: "●●○",
  emerging: "●○○",
};

const Dashboard = () => {
  const [, navigate] = useLocation();
  const { skills, targetRole, gapAnalysis, setGapAnalysis } = useSkills();
  const [loadingGap, setLoadingGap] = useState(false);

  const completeness = Math.min(100, Math.round((skills.length / 15) * 100));
  const missingForFull = Math.max(0, 15 - skills.length);

  const grouped = skills.reduce<Record<string, CategorizedSkill[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const handleGapAnalysis = async () => {
    setLoadingGap(true);
    try {
      const data = await apiFetch("analyze-gap", {
        skills: skills.map(s => ({ name: s.name, confidence: s.confidence, category: s.category })),
        target_role: targetRole,
      });
      if (data) {
        setGapAnalysis({ ...data, target_role: targetRole });
        navigate("/gap-analysis");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Gap analysis failed. Please try again.");
    } finally {
      setLoadingGap(false);
    }
  };

  if (skills.length === 0) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-3xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">My Skills Dashboard</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-sm">You're targeting: <strong className="text-foreground">{targetRole}</strong></span>
            </div>
          </motion.div>

          {/* Completeness Bar */}
          <motion.div
            className="p-5 rounded-2xl bg-card border border-border mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Profile Completeness</span>
              <span className="text-sm font-bold text-accent">{completeness}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${completeness}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            {missingForFull > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Add {missingForFull} more skills to unlock full analysis</p>
            )}
          </motion.div>

          {/* Skills Tag Cloud */}
          <motion.div
            className="p-6 rounded-2xl bg-card border border-border mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold font-display text-foreground mb-5">Your Skills ({skills.length})</h2>
            {Object.entries(grouped).map(([cat, catSkills]) => (
              <div key={cat} className="mb-5 last:mb-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  {categoryLabels[cat] || cat} ({catSkills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill) => (
                    <span
                      key={skill.name}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${categoryColors[skill.category] || "bg-muted text-foreground"}`}
                    >
                      {skill.name}
                      <span className="text-[10px] opacity-60" title={`Confidence: ${skill.confidence}`}>
                        {confidenceLabel[skill.confidence] || ""}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Action Cards */}
          <motion.div
            className="grid md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleGapAnalysis}
              disabled={loadingGap}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {loadingGap ? <Loader2 className="w-5 h-5 text-accent animate-spin" /> : <BarChart3 className="w-5 h-5 text-accent" />}
              </div>
              <h3 className="font-bold font-display text-foreground mb-1">View Gap Analysis</h3>
              <p className="text-xs text-muted-foreground">See where you stand vs market demand</p>
            </button>

            <button
              onClick={() => {
                if (gapAnalysis) navigate("/learning-path");
                else { handleGapAnalysis(); toast("Running gap analysis first..."); }
              }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5 text-lavender-foreground" />
              </div>
              <h3 className="font-bold font-display text-foreground mb-1">See Learning Path</h3>
              <p className="text-xs text-muted-foreground">Prioritized steps to close your gaps</p>
            </button>

            <button
              onClick={() => toast("Profile Builder coming soon!")}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold font-display text-foreground mb-1">Build DiversAI Profile</h3>
              <p className="text-xs text-muted-foreground">Turn skills into a live profile</p>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
