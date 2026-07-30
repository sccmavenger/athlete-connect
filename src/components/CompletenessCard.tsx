import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { completenessScore, scoreTone, type CompletenessInput } from "@/lib/completeness";
import { CheckCircle2, Circle } from "lucide-react";

export function CompletenessCard({
  athlete,
  compact = false,
}: {
  athlete: CompletenessInput;
  compact?: boolean;
}) {
  const { score, items, missing } = completenessScore(athlete);
  const tone = scoreTone(score);
  const top = missing.slice(0, 3);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Profile strength</h2>
          <p className={`text-sm font-semibold ${tone.className}`}>{tone.label}</p>
        </div>
        <div className="text-right">
          <span className="font-display text-3xl font-bold">{score}%</span>
        </div>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
      </div>

      {top.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold">Do these next</p>
          {top.map((m) => (
            <div key={m.key} className="rounded-lg border border-border/70 p-3">
              <p className="text-sm font-medium">{m.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
            </div>
          ))}
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link to="/profile/edit">Finish my profile</Link>
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Everything's filled in. Keep your schedule and highlights fresh so coaches see recent activity.
        </p>
      )}

      {!compact && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            See full checklist
          </summary>
          <div className="mt-3 grid gap-2">
            {items.map((i) => (
              <div key={i.key} className="flex items-center gap-2 text-sm">
                {i.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={i.done ? "" : "text-muted-foreground"}>{i.label}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </Card>
  );
}
