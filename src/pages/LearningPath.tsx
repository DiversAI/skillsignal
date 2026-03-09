import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Wrench, Award, CheckCircle2, Circle, Clock, Loader2, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useSkills } from "@/lib/skillsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusIcons = {
  not_started: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

const statusColors = {
  not_started: "text-muted-foreground",
  in_progress: "text-accent",
  done: "text-success",
};

const LearningPath = () => {
  const navigate = useNavigate();
  const { skills, targetRole, gapAnalysis, learningPath, setLearningPath, updateLearningStatus, updateGapStatus } = useSkills();
  const [loading, setLoading] = useState(learningPath.length === 0);

  useEffect(() => {
    if (learningPath.length > 0 || !gapAnalysis) {
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-learning-path", {
          body: { gaps: gapAnalysis.gaps, target_role: targetRole, existing_skills: skills.map(s => s.name) },
        });
        if (error) throw error;
        if (data?.steps) setLearningPath(data.steps);
      } catch (e) {
        console.error(e);
        toast.error("Failed to generate learning path.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const doneCount = learningPath.filter(s => s.status === "done").length;
  const totalSteps = learningPath.length;
  const progress = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  const cycleStatus = (skillName: string, current: string) => {
    const next = current === "not_started" ? "in_progress" : current === "in_progress" ? "done" : "not_started";
    updateLearningStatus(skillName, next as any);
    updateGapStatus(skillName, next as any);
    if (next === "done") {
      toast.success(`${skillName} marked as done! 🎉`);
      // Check milestones
      const newDone = learningPath.filter(s => s.status === "done").length + 1;
      const pct = Math.round((newDone / totalSteps) * 100);
      if (pct >= 25 && pct < 50 && Math.round(((newDone - 1) / totalSteps) * 100) < 25) toast("🔥 25% done! Keep it up!");
      if (pct >= 50 && pct < 75 && Math.round(((newDone - 1) / totalSteps) * 100) < 50) toast("🚀 Halfway there!");
      if (pct >= 75 && pct < 100 && Math.round(((newDone - 1) / totalSteps) * 100) < 75) toast("💪 75%! Almost there!");
      if (pct >= 100) toast("🏆 You did it! Your match score should be near 100%!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-foreground font-semibold">Building your learning path...</p>
          <p className="text-sm text-muted-foreground mt-1">Prioritizing by impact & effort</p>
        </div>
      </div>
    );
  }

  if (learningPath.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-semibold mb-4">No learning path yet.</p>
          <Button onClick={() => navigate("/gap-analysis")}>Run Gap Analysis First</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/gap-analysis")} className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gap Analysis
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">Your Learning Path</h1>
            <p className="text-muted-foreground mb-6">Prioritized by impact on getting hired + effort to close</p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            className="p-5 rounded-2xl bg-card border border-border mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                {doneCount}/{totalSteps} gaps closed
              </span>
              <span className="text-sm font-bold text-accent">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            {gapAnalysis && (
              <p className="text-xs text-muted-foreground mt-2">
                Match score: <strong className="text-accent">{gapAnalysis.match_score}%</strong> → closes gaps in real time
              </p>
            )}
          </motion.div>

          {/* Steps */}
          <div className="space-y-4">
            {learningPath.map((step, i) => {
              const StatusIcon = statusIcons[step.status];
              const statusColor = statusColors[step.status];

              return (
                <motion.div
                  key={step.skill_name}
                  className={`p-6 rounded-2xl bg-card border transition-all duration-200 ${
                    step.status === "done" ? "border-success/30 opacity-75" : "border-border"
                  }`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Status toggle */}
                    <button
                      onClick={() => cycleStatus(step.skill_name, step.status)}
                      className={`mt-1 shrink-0 transition-colors ${statusColor} hover:text-accent`}
                      title="Click to toggle status"
                    >
                      <StatusIcon className="w-6 h-6" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-bold font-display text-lg ${step.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          Step {i + 1}: {step.skill_name}
                        </h3>
                        <span className="text-xs text-muted-foreground shrink-0">~{step.effort_estimate}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{step.why_it_matters}</p>

                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                          <BookOpen className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Learn</p>
                            <p className="text-sm text-foreground">{step.learn.title}</p>
                            {step.learn.url && (
                              <a href={step.learn.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{step.learn.url}</a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                          <Wrench className="w-4 h-4 text-lavender-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-lavender-foreground uppercase tracking-wider mb-1">Practice</p>
                            <p className="text-sm text-foreground">{step.practice}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                          <Award className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Prove</p>
                            <p className="text-sm text-foreground">{step.prove}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Build Profile CTA */}
          <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Button
              onClick={() => toast("Profile Builder coming soon!")}
              className="w-full bg-gradient-primary text-primary-foreground font-semibold py-6 rounded-xl glow-primary hover:scale-[1.02] transition-transform text-base"
            >
              Build My DiversAI Profile <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
