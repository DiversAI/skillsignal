import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, RotateCcw, Copy, Check, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const sectionMeta = [
  { label: "What I've Built", icon: "🔨", description: "Projects, creations, and impact" },
  { label: "My Go-To Strengths", icon: "⚡", description: "What people trust me with" },
  { label: "Resilience Story", icon: "🔥", description: "Challenges overcome, lessons learned" },
];

interface Skill {
  name: string;
  evidence: string;
}

const Snapshot = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("skillSignalResponses");
    if (stored) {
      setResponses(JSON.parse(stored));
    } else {
      navigate("/prompts");
    }
  }, [navigate]);

  const handleCopy = async () => {
    let text = sectionMeta
      .map((s, i) => `${s.icon} ${s.label}\n${responses[i] || ""}`)
      .join("\n\n---\n\n");

    if (skills.length > 0) {
      text += "\n\n---\n\n🎯 Top Skills\n" + skills.map((s) => `• ${s.name} — ${s.evidence}`).join("\n");
    }

    await navigator.clipboard.writeText(`✨ My Skill Snapshot\n\n${text}`);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExtractSkills = async () => {
    setExtracting(true);
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

  if (responses.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 14 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="text-xs font-bold tracking-widest uppercase text-accent">
                Your Skill Snapshot
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Done. You're making real progress.
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Here's your skills and experience, reframed and ready to share.
            </p>
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
            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                onClick={handleExtractSkills}
                disabled={extracting}
                className="w-full bg-gradient-primary text-primary-foreground font-semibold px-6 py-6 rounded-xl hover:scale-[1.02] transition-transform duration-200 text-base glow-primary disabled:opacity-60 disabled:hover:scale-100"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing your experience...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Translate My Experience Into Skills
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI will identify 5–10 workforce-ready skills from your responses
              </p>
            </motion.div>
          )}

          {/* Skills Display */}
          <AnimatePresence>
            {skills.length > 0 && (
              <motion.div
                className="mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 80, damping: 14 }}
              >
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
                        <span className="text-xs font-bold text-accent mt-1 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h4 className="font-bold text-foreground mb-1">{skill.name}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{skill.evidence}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={handleExtractSkills}
                  variant="ghost"
                  disabled={extracting}
                  className="mt-4 text-muted-foreground hover:text-foreground"
                >
                  {extracting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Re-analyze
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={handleCopy}
              className="bg-gradient-primary text-primary-foreground font-semibold px-6 py-5 rounded-xl hover:scale-105 transition-transform duration-200 w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Snapshot
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/prompts")}
              className="border-border text-foreground rounded-xl py-5 w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Redo Prompts
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Snapshot;
