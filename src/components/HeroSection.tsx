import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/8 blur-[100px] pointer-events-none" />

      <div className="container max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              Your skills deserve to be seen
            </span>
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 14, delay: 0.2 }}
        >
          <span className="text-gradient-primary">Signal</span>{" "}
          <span className="text-foreground">your real</span>
          <br />
          <span className="text-foreground">skills to the world</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 14, delay: 0.35 }}
        >
          Three guided prompts. One powerful snapshot. Uncover and showcase 
          the skills that algorithms can't see.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 14, delay: 0.5 }}
        >
          <Button
            size="lg"
            className="bg-gradient-primary text-primary-foreground font-semibold text-lg px-8 py-6 rounded-xl glow-primary hover:scale-105 transition-transform duration-200"
            onClick={() => navigate("/prompts")}
          >
            Start Your Snapshot
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-border text-foreground font-medium text-lg px-8 py-6 rounded-xl hover:bg-secondary transition-colors duration-200"
            onClick={() => navigate("/snapshot?demo=true")}
          >
            Try the Demo
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
