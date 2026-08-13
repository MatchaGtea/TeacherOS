export type DocumentCategory =
  | "approval" | "correspondence" | "personnel" | "student"
  | "activity" | "finance" | "report" | "academic";

export type DocumentStatus =
  | "draft" | "waiting_head" | "waiting_director" | "approved" | "ready";

export type FieldKind = "text" | "textarea" | "date" | "number" | "people";

export type TemplateField = {
  key: string; label: string; kind: FieldKind; required: boolean;
  placeholder?: string; defaultValue?: string;
};

export type TemplatePart = { id: string; title: string; shortTitle: string; purpose: string };

export type DocumentTemplate = {
  id: string; title: string; description: string; category: DocumentCategory;
  keywords: string[]; fields: TemplateField[]; parts: TemplatePart[]; featured?: boolean;
};

export type ProcessNode = {
  id: string; title: string; role: "teacher" | "head" | "director" | "system"; terminal?: boolean;
};
export type ProcessEdge = { from: string; to: string };
export type ProcessGraph = { id: string; nodes: ProcessNode[]; edges: ProcessEdge[] };

export type ApprovalRecord = {
  stepId: string; actor: string; role: ProcessNode["role"];
  state: "pending" | "approved"; actedAt?: string;
};

export type WorkspaceDocument = {
  id: string; templateId: string; title: string;
  createdAt: string; updatedAt: string; status: DocumentStatus;
  fields: Record<string, string | string[]>; approvals: ApprovalRecord[];
};

export type ParsedIntent = {
  templateId: string; confidence: "high" | "medium" | "low";
  fields: Record<string, string | string[]>; matchedKeywords: string[];
};

export type WorkspaceState = { version: 2; documents: WorkspaceDocument[] };
