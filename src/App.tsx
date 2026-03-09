import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SkillsProvider } from "@/lib/skillsContext";
import Landing from "./pages/Landing";
import SkillsInput from "./pages/SkillsInput";
import Dashboard from "./pages/Dashboard";
import GapAnalysis from "./pages/GapAnalysis";
import LearningPath from "./pages/LearningPath";
import Prompts from "./pages/Prompts";
import Snapshot from "./pages/Snapshot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SkillsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/skills-input" element={<SkillsInput />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gap-analysis" element={<GapAnalysis />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/snapshot" element={<Snapshot />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SkillsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
