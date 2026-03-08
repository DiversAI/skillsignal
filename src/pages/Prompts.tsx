import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { DEMO_RESPONSES } from "@/data/demoData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";

const prompts = [
  {
    id: 1,
    title: "What have you built, created, or made happen?",
    subtitle: "Think beyond job titles. Projects, side hustles, community work — it all counts.",
    placeholder: "I organized a neighborhood cleanup that brought 50 people together... I taught myself to build websites and made one for my cousin's bakery...",
  },
  {
    id: 2,
    title: "What do people come to you for?",
    subtitle: "The things others trust you with reveal skills you might take for granted.",
    placeholder: "Friends always ask me to proofread their important emails... My team used to rely on me to break down complex problems into simple steps...",
  },
  {
    id: 3,
    title: "What challenge did you overcome, and what did it teach you?",
    subtitle: "Resilience and adaptability are superpowers. Show them.",
    placeholder: "When my department was restructured, I pivoted from marketing to operations in 3 months... I learned a new language to better serve my community...",
  },
];

const Prompts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>(["", "", ""]);

  // Demo mode: pre-fill and auto-navigate
  useEffect(() => {
    if (isDemo) {
      localStorage.setItem("skillSignalResponses", JSON.stringify(DEMO_RESPONSES));
      localStorage.setItem("skillSignalDemo", "true");
      navigate("/snapshot?demo=true", { replace: true, state: { demo: true } });
    }
  }, [isDemo, navigate]);

  const handleResponseChange = (value: string) => {
    const updated = [...responses];
    updated[currentStep] = value;
    setResponses(updated);
  };

  const canProceed = responses[currentStep].trim().length > 10;

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save to localStorage for now (will use Cloud later)
      localStorage.setItem("skillSignalResponses", JSON.stringify(responses));
      navigate("/snapshot");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const prompt = prompts[currentStep];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-12">
            {prompts.map((_, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < currentStep
                      ? "bg-gradient-primary"
                      : i === currentStep
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
            >
              {/* Step indicator */}
              <span className="text-xs font-bold tracking-widest uppercase text-accent mb-4 block">
                Prompt {currentStep + 1} of 3
              </span>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                {prompt.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                {prompt.subtitle}
              </p>

              <Textarea
                value={responses[currentStep]}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder={prompt.placeholder}
                className="min-h-[200px] bg-card border-border text-foreground text-base leading-relaxed p-5 rounded-xl resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
              />

              <p className="text-xs text-muted-foreground mt-3">
                {responses[currentStep].trim().length > 0
                  ? `${responses[currentStep].trim().length} characters`
                  : "Write at least a few sentences — the more detail, the better your snapshot."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-gradient-primary text-primary-foreground font-semibold px-6 py-5 rounded-xl hover:scale-105 transition-transform duration-200 disabled:opacity-40 disabled:hover:scale-100"
            >
              {currentStep < 2 ? (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  See My Snapshot
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompts;
