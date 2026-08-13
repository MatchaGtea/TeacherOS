import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api";
import { fixtureExam } from "../fixtures";
import type { Exam } from "../types";

type ExamContextValue = {
  exam: Exam;
  loading: boolean;
  generating: boolean;
  statusMessage?: string;
  generate: (mode: "fixture" | "ai") => Promise<void>;
};
const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exam, setExam] = useState(fixtureExam);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>();
  useEffect(() => {
    let active = true;
    api.exam().then((result) => {
      if (active) {
        setExam(result.data);
        setStatusMessage(result.message);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const value = useMemo<ExamContextValue>(
    () => ({
      exam,
      loading,
      generating,
      statusMessage,
      generate: async (mode) => {
        setGenerating(true);
        const result = await api.generate(mode);
        setExam(result.data);
        setStatusMessage(result.message ?? result.data.pipeline.warning);
        setGenerating(false);
      },
    }),
    [exam, loading, generating, statusMessage],
  );
  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam() {
  const value = useContext(ExamContext);
  if (!value) throw new Error("useExam must be used within ExamProvider");
  return value;
}
