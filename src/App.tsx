import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { SkillsProvider } from "@/lib/skillsContext";
import Landing from "./pages/Landing";
import SkillsInput from "./pages/SkillsInput";
import Dashboard from "./pages/Dashboard";
import GapAnalysis from "./pages/GapAnalysis";
import LearningPath from "./pages/LearningPath";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SkillsProvider>
        <Toaster />
        <Sonner />
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/skills-input" component={SkillsInput} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/gap-analysis" component={GapAnalysis} />
          <Route path="/learning-path" component={LearningPath} />
          <Route component={NotFound} />
        </Switch>
      </SkillsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
