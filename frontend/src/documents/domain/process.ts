import type { ProcessGraph } from "./types";

export const documentProcessGraph: ProcessGraph = {
  id: "teacheros-document-approval-v2",
  nodes: [
    { id: "draft", title: "จัดทำร่าง", role: "teacher" },
    { id: "information_check", title: "ตรวจสอบข้อมูล", role: "system" },
    { id: "head_approval", title: "หัวหน้ากลุ่มสาระอนุมัติ", role: "head" },
    { id: "director_approval", title: "ผู้อำนวยการอนุมัติ", role: "director" },
    { id: "print_ready", title: "พร้อมพิมพ์", role: "system", terminal: true },
  ],
  edges: [
    { from: "draft", to: "information_check" }, { from: "information_check", to: "head_approval" },
    { from: "head_approval", to: "director_approval" }, { from: "director_approval", to: "print_ready" },
  ],
};

export function isValidProcessGraph(graph: ProcessGraph = documentProcessGraph): boolean {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length || graph.edges.some((edge) => !ids.has(edge.from) || !ids.has(edge.to))) return false;
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const edge of graph.edges.filter((entry) => entry.from === id)) if (!visit(edge.to)) return false;
    visiting.delete(id); visited.add(id); return true;
  };
  return graph.nodes.every((node) => visit(node.id));
}
