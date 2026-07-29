import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reviewCoachRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string; decision: "approved" | "rejected" }) => {
    if (!input?.requestId || typeof input.requestId !== "string") throw new Error("requestId required");
    if (input.decision !== "approved" && input.decision !== "rejected") throw new Error("Invalid decision");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: reqError } = await supabaseAdmin
      .from("coach_requests")
      .select("id, user_id, status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqError) throw new Error(reqError.message);
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request already reviewed");

    if (data.decision === "approved") {
      const { error: grantError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: req.user_id, role: "coach" });
      if (grantError && !grantError.message.toLowerCase().includes("duplicate")) {
        throw new Error(grantError.message);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("coach_requests")
      .update({
        status: data.decision,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.id);
    if (updateError) throw new Error(updateError.message);

    return { ok: true, status: data.decision };
  });
