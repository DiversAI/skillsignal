import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Upload, Link2, Keyboard, Layers, Users, Target, Sparkles, BarChart3, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkills } from "@/lib/skillsContext";
import Navbar from "@/components/Navbar";

const Landing = () => {
  const navigate = useNavigate();
  const { mode, setMode, setEntryMethod } = useSkills();

  const handleEntry = (method: "resume" | "linkedin" | "manual") => {
    setEntryMethod(method);
    navigate("/skills-input");
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-subtle">
      <Navbar />

      {/* Resume Roast Banner */}
      <div className="pt-16">
        <div className="bg-secondary border-b border-border">
          <div className="container max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-muted-foreground">Coming from Resume Roast?</span>
            <span className="font-semibold text-foreground">Your skills are waiting.</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary blur-[120px] pointer-events-none" />

        <div className="container max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Mode Toggle */}
          <motion.div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-border mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setMode("job_seeker")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "job_seeker"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Target className="w-4 h-4" />
              Job Seeker
            </button>
            <button
              onClick={() => setMode("ld")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "ld"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              L&D / Instructor
            </button>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-extrabold font-display tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-gradient-primary">Know your skills.</span>
            <br />
            <span className="text-foreground">Close the gap.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {mode === "job_seeker"
              ? "See exactly where your skills stand vs the job you want. Get a clear path to close the gap. Turn your real skills into a live DiversAI profile."
              : "Map your cohort's skills, identify gaps at scale, and track progress toward workforce readiness."}
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground/70 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You know what's wrong with your resume. Now let's fix what's underneath it.
          </motion.p>

          {/* Entry Points */}
          {mode === "job_seeker" ? (
            <motion.div
              className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => handleEntry("resume")}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold font-display text-foreground mb-1">Upload Resume</h3>
                <p className="text-sm text-muted-foreground">Drop your PDF or DOCX — AI extracts your skills instantly</p>
              </button>

              <button
                onClick={() => handleEntry("linkedin")}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Link2 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold font-display text-foreground mb-1">LinkedIn URL</h3>
                <p className="text-sm text-muted-foreground">Paste your profile link — we'll pull your skills & experience</p>
              </button>

              <button
                onClick={() => handleEntry("manual")}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Keyboard className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold font-display text-foreground mb-1">Manual Entry</h3>
                <p className="text-sm text-muted-foreground">Type your skills — smart suggestions as you go</p>
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="lg"
                className="w-full bg-gradient-primary text-primary-foreground font-semibold text-lg px-8 py-6 rounded-xl glow-primary hover:scale-105 transition-transform"
                onClick={() => {
                  setEntryMethod("manual");
                  navigate("/skills-input");
                }}
              >
                Start L&D Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">Map cohort skills, identify gaps, and track workforce readiness</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* How it works */}
      {mode === "job_seeker" && (
        <section className="py-20 px-6">
          <div className="container max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4 text-foreground">
              Three things no one else does
            </h2>
            <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">
              SkillsOS shows you where you stand, how to close the gap, and turns your skills into a live profile.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: BarChart3,
                  title: "Skills Gap Analysis",
                  description: "See exactly where your skills stand vs the job you want. Visual gap map with match score.",
                },
                {
                  icon: GraduationCap,
                  title: "Personalized Learning Path",
                  description: "AI-generated, prioritized steps to close your gaps. Free resources, practice projects, proof methods.",
                },
                {
                  icon: Layers,
                  title: "Live DiversAI Profile",
                  description: "Turn your skills into an employer-visible, bias-reduced profile. No resume needed.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="p-8 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            SkillsOS by DiversAI — your skills deserve to be seen.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
