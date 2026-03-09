import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertTriangle, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useSkills } from "@/lib/skillsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const difficultyConfig = {
  easy: { label: "Quick Win", color: "text-success", bg: "bg-success/15" },
  moderate: { label: "1-3 Months", color: "text-warning", bg: "bg-warning/15" },
  intensive: { label: "3-6+ Months", color: "text-destructive", bg: "bg-destructive/15" },
};

const importanceConfig = {
  critical: { label: "Critical", color: "text-destructive" },
  important: { label: "Important", color: "text-warning" },
  nice_to_have: { label: "Nice to Have", color: "text-muted-foreground" },
};

const GapAnalysis = () => {
  const navigate = useNavigate();
  const { skills, targetRole, gapAnalysis, setGapAnalysis, setLearningPath, updateGapStatus } = useSkills();
  const [loading, setLoading] = useState(!gapAnalysis);
  const [loadingPath, setLoadingPath] = useState(false);

  useEffect(() => {
    if (gapAnalysis || skills.length === 0) {
      if (skills.length === 0) navigate("/");
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("analyze-gap", {
          body: { skills: skills.map(s => ({ name: s.name, confidence: s.confidence, category: s.category })), target_role: targetRole },
        });
        if (error) throw error;
        if (data) setGapAnalysis({ ...data, target_role: targetRole });
      } catch (e) {
        console.error(e);
        toast.error("Gap analysis failed.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleLearningPath = async () => {
    if (!gapAnalysis) return;
    setLoadingPath(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-learning-path", {
        body: { gaps: gapAnalysis.gaps, target_role: targetRole, existing_skills: skills.map(s => s.name) },
      });
      if (error) throw error;
      if (data?.steps) {
        setLearningPath(data.steps);
        navigate("/learning-path");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate learning path.");
    } finally {
      setLoadingPath(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-foreground font-semibold">Analyzing your skills gap...</p>
          <p className="text-sm text-muted-foreground mt-1">Comparing against market demand for {targetRole}</p>
        </div>
      </div>
    );
  }

  if (!gapAnalysis) return null;

  const { match_score, strengths, gaps, differentiators } = gapAnalysis;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-3xl mx-auto">
          {/* Back */}
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>

          {/* Match Score */}
          <motion.div
            className="p-8 rounded-2xl bg-card border border-border text-center mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-semibold">Your Skills vs Market Demand</p>
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                <motion.circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={match_score >= 75 ? "hsl(var(--success))" : match_score >= 50 ? "hsl(var(--accent))" : "hsl(var(--warning))"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 97.4" }}
                  animate={{ strokeDasharray: `${(match_score / 100) * 97.4} 97.4` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-display text-foreground">{match_score}%</span>
                <span className="text-xs text-muted-foreground">ready</span>
              </div>
            </div>
            <h2 className="text-xl font-bold font-display text-foreground">
              You're {match_score}% ready for <span className="text-accent">{targetRole}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {match_score >= 75 ? "You're in great shape! A few tweaks and you're there." :
               match_score >= 50 ? "Solid foundation — let's close the remaining gaps." :
               "Good starting point — we'll build a clear path forward."}
            </p>
          </motion.div>

          {/* Gap Map - Two Column */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Your Strengths */}
            <motion.div
              className="p-6 rounded-2xl bg-card border border-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-success uppercase tracking-wider mb-4">
                <CheckCircle2 className="w-4 h-4" /> Your Strengths ({strengths.length})
              </h3>
              <div className="space-y-2">
                {strengths.map((s) => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-sm text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Gaps to Close */}
            <motion.div
              className="p-6 rounded-2xl bg-card border border-border"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-warning uppercase tracking-wider mb-4">
                <AlertTriangle className="w-4 h-4" /> Gaps to Close ({gaps.length})
              </h3>
              <div className="space-y-2">
                {gaps.map((g) => {
                  const diff = difficultyConfig[g.difficulty] || difficultyConfig.moderate;
                  const imp = importanceConfig[g.importance] || importanceConfig.important;
                  return (
                    <div key={g.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-warning/5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                        <span className="text-sm text-foreground">{g.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>{diff.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Differentiators */}
          {differentiators.length > 0 && (
            <motion.div
              className="p-6 rounded-2xl bg-secondary/50 border border-border mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-lavender-foreground uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" /> Your Differentiators
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Skills others applying for {targetRole} often don't have</p>
              <div className="flex flex-wrap gap-2">
                {differentiators.map((d) => (
                  <span key={d} className="px-3 py-1.5 rounded-full bg-secondary text-lavender-foreground text-sm font-medium border border-lavender-foreground/20">
                    ✨ {d}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Button
              onClick={handleLearningPath}
              disabled={loadingPath}
              className="w-full bg-gradient-primary text-primary-foreground font-semibold py-6 rounded-xl glow-primary hover:scale-[1.02] transition-transform text-base"
            >
              {loadingPath ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating your learning path...</>
              ) : (
                <>Get My Personalized Learning Path <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysis;
