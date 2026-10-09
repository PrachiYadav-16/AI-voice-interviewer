import { SCALE } from "@/lib/interview/rubrics";
import { cn } from "@/lib/utils";

export function scoreTone(score: number | null) {
  if (score === null) return "bg-line text-muted";
  if (score >= 4) return "bg-sage-soft text-sage";
  if (score >= 3) return "bg-indigo-soft text-indigo";
  return "bg-brick-soft text-brick";
}

export function ScoreChip({ score }: { score: number | null }) {
  const label = score === null ? "Not rated" : `${score}/5 · ${SCALE[score - 1].label}`;
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", scoreTone(score))}>{label}</span>;
}

/** Horizontal 1–5 bar; empty when not rated. */
export function CriterionBar({ name, average, rated }: { name: string; average: number | null; rated: number }) {
  const pct = average === null ? 0 : ((average - 1) / 4) * 100;
  return (
    <div className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-[0.95rem] sm:grid-cols-[11rem_1fr_3rem]">
      <span className="truncate">{name}</span>
      <div className="h-2 rounded-full bg-line" role="img" aria-label={average === null ? `${name}: not rated` : `${name}: ${average} out of 5`}>
        <div className={cn("h-full rounded-full", average !== null && average >= 4 ? "bg-sage" : average !== null && average < 3 ? "bg-brick" : "bg-indigo")} style={{ width: `${Math.max(pct, average === null ? 0 : 3)}%` }} />
      </div>
      <span className="text-right font-bold tabular-nums" title={`${rated} rating${rated === 1 ? "" : "s"}`}>
        {average === null ? "—" : average.toFixed(1)}
      </span>
    </div>
  );
}
