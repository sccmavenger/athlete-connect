import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { REPORT_REASONS, submitReport, type ReportTargetType } from "@/lib/safety.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ReportDialog({
  targetType,
  targetId,
  athleteId,
  reportedUserId,
  what,
  trigger,
}: {
  targetType: ReportTargetType;
  targetId: string;
  athleteId?: string | null;
  reportedUserId?: string | null;
  /** Plain-language name of the thing being reported, e.g. "this message". */
  what: string;
  trigger: ReactNode;
}) {
  const send = useServerFn(submitReport);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await send({
        data: {
          targetType,
          targetId,
          athleteId: athleteId ?? null,
          reportedUserId: reportedUserId ?? null,
          reason,
          details,
        },
      });
      toast.success("Report sent. Our team reviews reports within 24 hours.");
      setOpen(false);
      setDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We couldn't send that report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {what}</DialogTitle>
          <DialogDescription>
            Tell us what's wrong. Reports are private, reviewed within 24 hours, and can lead to
            content removal or account termination.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Reason</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2 space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  <Label htmlFor={`reason-${r}`} className="text-sm font-normal">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="report-details" className="text-xs uppercase tracking-wide text-muted-foreground">
              Details (optional)
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Anything else we should know?"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="secondary" className="h-11" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" className="h-11" onClick={submit} disabled={busy}>
            {busy ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
