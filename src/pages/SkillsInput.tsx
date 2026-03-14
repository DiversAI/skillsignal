import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Plus, Loader2, ArrowRight, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  technical: "bg-accent/15 text-accent border-accent/30",
  soft: "bg-secondary text-lavender-foreground border-lavender-foreground/20",
  tools: "bg-primary/10 text-primary border-primary/30",
  domain: "bg-warning/15 text-warning-foreground border-warning/30",
};

const SkillsInput = () => {
  const [, navigate] = useLocation();
  const { entryMethod, skills, setSkills, targetRole, setTargetRole, setResumeText } = useSkills();
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showTargetRole, setShowTargetRole] = useState(skills.length > 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      toast.error("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setFileName(file.name);
    setLoading(true);

    try {
      const reader = new FileReader();
      const text = await new Promise<string>((resolve, reject) => {
        if (ext === "txt") {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        } else {
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      });

      const data = await apiFetch("extract-resume-skills", {
        text: ext === "txt" ? text : undefined,
        file_base64: ext !== "txt" ? text : undefined,
        file_type: ext,
      });

      if (data?.skills) {
        const allSkills: CategorizedSkill[] = [];
        for (const cat of ["technical", "soft", "tools", "domain"] as const) {
          if (data.skills[cat]) {
            for (const s of data.skills[cat]) {
              allSkills.push({ name: s.skill, confidence: s.confidence, category: cat });
            }
          }
        }
        setSkills(allSkills);
        setResumeText(typeof text === "string" && ext === "txt" ? text : "");
        setShowTargetRole(true);
        toast.success(`Extracted ${allSkills.length} skills from your resume!`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to extract skills. Please try again or use manual entry.");
    } finally {
      setLoading(false);
    }
  }, [setSkills, setResumeText]);

  const handleLinkedIn = async () => {
    if (!linkedinUrl.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch("extract-linkedin-skills", {
        url: linkedinUrl.trim(),
      });
      if (data?.skills) {
        const allSkills: CategorizedSkill[] = [];
        for (const cat of ["technical", "soft", "tools", "domain"] as const) {
          if (data.skills[cat]) {
            for (const s of data.skills[cat]) {
              allSkills.push({ name: s.skill, confidence: s.confidence, category: cat });
            }
          }
        }
        setSkills(allSkills);
        setShowTargetRole(true);
        toast.success(`Extracted ${allSkills.length} skills!`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't extract from LinkedIn. Try manual entry instead.");
    } finally {
      setLoading(false);
    }
  };

  const addManualSkill = () => {
    const name = manualInput.trim();
    if (!name) return;
    if (skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    setSkills([...skills, { name, confidence: "medium", category: "technical" }]);
    setManualInput("");
    if (!showTargetRole && skills.length >= 2) setShowTargetRole(true);
  };

  const removeSkill = (name: string) => {
    setSkills(skills.filter(s => s.name !== name));
  };

  const handleContinue = () => {
    if (skills.length < 3) {
      toast.error("Add at least 3 skills to continue.");
      return;
    }
    if (!targetRole.trim()) {
      toast.error("Enter a target role to get your gap analysis.");
      return;
    }
    navigate("/dashboard");
  };

  const grouped = skills.reduce<Record<string, CategorizedSkill[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">
              {entryMethod === "resume" ? "Upload Your Resume" : entryMethod === "linkedin" ? "Connect LinkedIn" : "Add Your Skills"}
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              {entryMethod === "resume"
                ? "Drop your resume — AI will extract and categorize your skills."
                : entryMethod === "linkedin"
                ? "Paste your LinkedIn URL to pull in your skills automatically."
                : "Type your skills and press Enter. We'll categorize them for you."}
            </p>
          </motion.div>

          {/* Resume Upload */}
          {entryMethod === "resume" && !showTargetRole && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                  dragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <p className="text-foreground font-semibold">Analyzing {fileName}...</p>
                    <p className="text-sm text-muted-foreground">Extracting and categorizing your skills</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-accent" />
                    </div>
                    <p className="text-foreground font-semibold text-lg">Drop your resume here</p>
                    <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT — max 10MB</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* LinkedIn Input */}
          {entryMethod === "linkedin" && !showTargetRole && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="flex-1"
                />
                <Button onClick={handleLinkedIn} disabled={loading || !linkedinUrl.trim()} className="bg-gradient-primary text-primary-foreground">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract"}
                </Button>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">We'll analyze your public LinkedIn profile to extract skills. Make sure your profile is set to public.</p>
              </div>
            </motion.div>
          )}

          {/* Manual Entry */}
          {entryMethod === "manual" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex gap-3 mb-6">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualSkill(); } }}
                  placeholder="Type a skill and press Enter..."
                  className="flex-1"
                />
                <Button onClick={addManualSkill} variant="outline" size="icon" disabled={!manualInput.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Skills Tag Cloud */}
          {skills.length > 0 && (
            <motion.div className="mt-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-display text-foreground">Your Skills ({skills.length})</h2>
                <span className="text-xs text-muted-foreground">Click to remove</span>
              </div>

              {Object.entries(grouped).map(([cat, catSkills]) => (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {categoryLabels[cat] || cat}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((skill) => (
                      <motion.button
                        key={skill.name}
                        onClick={() => removeSkill(skill.name)}
                        className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:opacity-70 ${categoryColors[skill.category] || "bg-muted text-foreground"}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        layout
                      >
                        {skill.name}
                        <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add more skills for resume/linkedin */}
              {entryMethod !== "manual" && (
                <div className="flex gap-3 mt-4">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualSkill(); } }}
                    placeholder="Add more skills..."
                    className="flex-1"
                  />
                  <Button onClick={addManualSkill} variant="outline" size="icon" disabled={!manualInput.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Target Role */}
          {(showTargetRole || (entryMethod === "manual" && skills.length >= 3)) && (
            <motion.div className="mt-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold font-display text-foreground mb-2">What role are you working toward?</h2>
              <p className="text-sm text-muted-foreground mb-4">This powers your personalized gap analysis.</p>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Product Manager, UX Designer, Data Analyst..."
                className="mb-6"
              />

              <Button
                onClick={handleContinue}
                disabled={skills.length < 3 || !targetRole.trim()}
                className="w-full bg-gradient-primary text-primary-foreground font-semibold py-6 rounded-xl glow-primary hover:scale-[1.02] transition-transform text-base"
              >
                See My Skills Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsInput;
