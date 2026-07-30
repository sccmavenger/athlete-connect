export const PIPELINE_STAGES = [
  { value: "watching", label: "Watching" },
  { value: "evaluating", label: "Evaluating" },
  { value: "contacted", label: "Contacted" },
  { value: "offered", label: "Offered" },
  { value: "passed", label: "Passed" },
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number]["value"];

export function stageLabel(v: string | null | undefined) {
  return PIPELINE_STAGES.find((s) => s.value === v)?.label ?? "Watching";
}

export function stageClasses(v: string | null | undefined) {
  switch (v) {
    case "offered":
      return "bg-primary/20 text-primary";
    case "evaluating":
      return "bg-accent/20 text-accent";
    case "contacted":
      return "bg-secondary text-secondary-foreground";
    case "passed":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}
