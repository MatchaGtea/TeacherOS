import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  approveCurrentStep as approve, createDocument as create, loadWorkspace, markReady as ready,
  generateDocumentId, resetWorkspace as reset, saveWorkspace, submitForApproval as submit, updateDocument as update,
} from "./workspace";
import type { WorkspaceDocument, WorkspaceState } from "./types";

type DocumentWorkspaceValue = {
  state: WorkspaceState;
  createDocument: (templateId: string, fields: WorkspaceDocument["fields"]) => string;
  updateDocument: (id: string, fields: WorkspaceDocument["fields"]) => void;
  submitForApproval: (id: string) => void;
  approveCurrentStep: (id: string) => void;
  markReady: (id: string) => void;
  resetWorkspace: () => void;
};
const Context = createContext<DocumentWorkspaceValue | null>(null);

export function DocumentWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() => loadWorkspace());
  const value = useMemo<DocumentWorkspaceValue>(() => ({
    state,
    createDocument(templateId, fields) {
      const id = generateDocumentId(state.documents.map((document) => document.id));
      setState((previous) => { const next = create(previous, templateId, fields, new Date().toISOString(), id); saveWorkspace(next); return next; });
      return id;
    },
    updateDocument: (id, fields) => setState((previous) => { const next = update(previous, id, fields); saveWorkspace(next); return next; }),
    submitForApproval: (id) => setState((previous) => { const next = submit(previous, id); saveWorkspace(next); return next; }),
    approveCurrentStep: (id) => setState((previous) => { const next = approve(previous, id); saveWorkspace(next); return next; }),
    markReady: (id) => setState((previous) => { const next = ready(previous, id); saveWorkspace(next); return next; }),
    resetWorkspace: () => setState(() => { const next = reset(); saveWorkspace(next); return next; }),
  }), [state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDocumentWorkspace(): DocumentWorkspaceValue {
  const value = useContext(Context); if (!value) throw new Error("useDocumentWorkspace must be used within DocumentWorkspaceProvider"); return value;
}
