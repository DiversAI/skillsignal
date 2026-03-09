import React, { createContext, useContext, useState, useCallback } from "react";

export interface CategorizedSkill {
  name: string;
  confidence: "high" | "medium" | "emerging";
  category: "technical" | "soft" | "tools" | "domain";
}

export interface SkillGap {
  name: string;
  importance: "critical" | "important" | "nice_to_have";
  difficulty: "easy" | "moderate" | "intensive";
  action: string;
  effort_estimate: string;
  learn_resource: string;
  practice_idea: string;
  prove_method: string;
  status: "not_started" | "in_progress" | "done";
}

export interface GapAnalysis {
  match_score: number;
  strengths: string[];
  gaps: SkillGap[];
  differentiators: string[];
  target_role: string;
}

export interface LearningStep {
  skill_name: string;
  why_it_matters: string;
  effort_estimate: string;
  learn: { title: string; url: string; type: string };
  practice: string;
  prove: string;
  status: "not_started" | "in_progress" | "done";
}

interface SkillsState {
  mode: "job_seeker" | "ld";
  skills: CategorizedSkill[];
  targetRole: string;
  gapAnalysis: GapAnalysis | null;
  learningPath: LearningStep[];
  entryMethod: "resume" | "linkedin" | "manual" | null;
  resumeText: string;
}

interface SkillsContextType extends SkillsState {
  setMode: (mode: "job_seeker" | "ld") => void;
  setSkills: (skills: CategorizedSkill[]) => void;
  setTargetRole: (role: string) => void;
  setGapAnalysis: (analysis: GapAnalysis | null) => void;
  setLearningPath: (path: LearningStep[]) => void;
  setEntryMethod: (method: "resume" | "linkedin" | "manual" | null) => void;
  setResumeText: (text: string) => void;
  updateGapStatus: (skillName: string, status: "not_started" | "in_progress" | "done") => void;
  updateLearningStatus: (skillName: string, status: "not_started" | "in_progress" | "done") => void;
  reset: () => void;
}

const initialState: SkillsState = {
  mode: "job_seeker",
  skills: [],
  targetRole: "",
  gapAnalysis: null,
  learningPath: [],
  entryMethod: null,
  resumeText: "",
};

const SkillsContext = createContext<SkillsContextType | null>(null);

export const SkillsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SkillsState>(initialState);

  const setMode = useCallback((mode: "job_seeker" | "ld") => setState(s => ({ ...s, mode })), []);
  const setSkills = useCallback((skills: CategorizedSkill[]) => setState(s => ({ ...s, skills })), []);
  const setTargetRole = useCallback((targetRole: string) => setState(s => ({ ...s, targetRole })), []);
  const setGapAnalysis = useCallback((gapAnalysis: GapAnalysis | null) => setState(s => ({ ...s, gapAnalysis })), []);
  const setLearningPath = useCallback((learningPath: LearningStep[]) => setState(s => ({ ...s, learningPath })), []);
  const setEntryMethod = useCallback((entryMethod: "resume" | "linkedin" | "manual" | null) => setState(s => ({ ...s, entryMethod })), []);
  const setResumeText = useCallback((resumeText: string) => setState(s => ({ ...s, resumeText })), []);

  const updateGapStatus = useCallback((skillName: string, status: "not_started" | "in_progress" | "done") => {
    setState(s => {
      if (!s.gapAnalysis) return s;
      const gaps = s.gapAnalysis.gaps.map(g => g.name === skillName ? { ...g, status } : g);
      const closedCount = gaps.filter(g => g.status === "done").length;
      const totalGaps = gaps.length;
      const baseScore = s.gapAnalysis.match_score;
      const maxGain = 100 - baseScore;
      const newScore = Math.min(100, Math.round(baseScore + (closedCount / totalGaps) * maxGain));
      return { ...s, gapAnalysis: { ...s.gapAnalysis, gaps, match_score: newScore } };
    });
  }, []);

  const updateLearningStatus = useCallback((skillName: string, status: "not_started" | "in_progress" | "done") => {
    setState(s => ({
      ...s,
      learningPath: s.learningPath.map(step => step.skill_name === skillName ? { ...step, status } : step),
    }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return (
    <SkillsContext.Provider value={{ ...state, setMode, setSkills, setTargetRole, setGapAnalysis, setLearningPath, setEntryMethod, setResumeText, updateGapStatus, updateLearningStatus, reset }}>
      {children}
    </SkillsContext.Provider>
  );
};

export const useSkills = () => {
  const ctx = useContext(SkillsContext);
  if (!ctx) throw new Error("useSkills must be used within SkillsProvider");
  return ctx;
};
