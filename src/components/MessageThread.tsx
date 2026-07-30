import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

export type MessageRow = {
  id: string;
  athlete_id: string;
  coach_user_id: string;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export function MessageThread({
  athleteId,
  coachUserId,
  currentUserId,
  /** "coach" when the signed-in user is the coach side of the thread. */
  side,
  title,
  subtitle,
  hint,
}: {
  athleteId: string;
  coachUserId: string;
  currentUserId: string;
  side: "coach" | "athlete";
  title: string;
  subtitle?: string | null;
  hint?: string;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["thread", athleteId, coachUserId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("coach_user_id", coachUserId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  const messages = q.data ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  // Mark inbound messages read.
  useEffect(() => {
    const unread = messages.filter((m) => !m.read_at && m.sender_user_id !== currentUserId).map((m) => m.id);
    if (unread.length === 0) return;
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread)
      .then(() => qc.invalidateQueries({ queryKey: ["thread", athleteId, coachUserId] }));
  }, [messages, currentUserId, athleteId, coachUserId, qc]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    if (text.length > 2000) return toast.error("Message must be 2000 characters or fewer");
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      athlete_id: athleteId,
      coach_user_id: coachUserId,
      sender_user_id: currentUserId,
      body: text,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
    qc.invalidateQueries({ queryKey: ["thread", athleteId, coachUserId] });
    qc.invalidateQueries({ queryKey: ["message-threads"] });
    toast.success("Message sent");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="max-h-[50vh] min-h-40 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {q.isPending ? (
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {hint ?? "No messages yet — send the first one."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_user_id === currentUserId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={
            side === "coach"
              ? "Message this athlete and their family…"
              : "Introduce yourself: position, class year, GPA, and a highlight link."
          }
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">{body.length}/2000</span>
          <Button size="sm" onClick={send} disabled={sending || !body.trim()}>
            <Send className="mr-1.5 h-4 w-4" />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
