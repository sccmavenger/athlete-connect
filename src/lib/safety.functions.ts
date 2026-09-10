import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const REPORT_REASONS = [
  "Harassment or bullying",
  "Inappropriate or sexual content",
  "Spam or scam",
  "Impersonation or fake profile",
  "Violence or threats",
  "Concern about a minor's safety",
  "Something else",
] as const;

export type ReportTargetType = "message" | "athlete_profile" | "user";

export interface ContentReportRow {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  athlete_id: string | null;
  reported_user_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "actioned" | "dismissed";
  resolution_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reporter_email: string | null;
  reported_email: string | null;
  athlete_name: string | null;
  message_body: string | null;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Resolves the other participant of a coach <-> athlete conversation. */
export const getThreadSafety = createServerFn({ method: "GET" })
  .inputValidator((data: { athleteId: string; coachUserId: string }) => {
    if (!data?.athleteId || !data?.coachUserId) throw new Error("Missing conversation");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const { data: isManager } = await context.supabase.rpc("is_athlete_manager", {
      _athlete_id: data.athleteId,
      _user_id: me,
    });
    if (!isManager && me !== data.coachUserId) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: athlete } = await supabaseAdmin
      .from("athletes")
      .select("user_id, full_name")
      .eq("id", data.athleteId)
      .maybeSingle();

    const otherUserId = me === data.coachUserId ? (athlete?.user_id ?? null) : data.coachUserId;
    if (!otherUserId) {
      return { otherUserId: null, iBlockedThem: false, theyBlockedMe: false };
    }

    const { data: blocks } = await supabaseAdmin
      .from("user_blocks")
      .select("blocker_user_id, blocked_user_id")
      .or(
        `and(blocker_user_id.eq.${me},blocked_user_id.eq.${otherUserId}),and(blocker_user_id.eq.${otherUserId},blocked_user_id.eq.${me})`,
      );

    return {
      otherUserId,
      iBlockedThem: (blocks ?? []).some((b) => b.blocker_user_id === me),
      theyBlockedMe: (blocks ?? []).some((b) => b.blocker_user_id === otherUserId),
    };
  });

export const setBlock = createServerFn({ method: "POST" })
  .inputValidator((data: { targetUserId: string; blocked: boolean; reason?: string }) => {
    if (!data?.targetUserId) throw new Error("Missing person to block");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    if (data.targetUserId === context.userId) throw new Error("You can't block yourself");
    if (data.blocked) {
      const { error } = await context.supabase.from("user_blocks").upsert(
        {
          blocker_user_id: context.userId,
          blocked_user_id: data.targetUserId,
          reason: data.reason ?? null,
        },
        { onConflict: "blocker_user_id,blocked_user_id" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_user_id", context.userId)
        .eq("blocked_user_id", data.targetUserId);
      if (error) throw new Error(error.message);
    }
    return { blocked: data.blocked };
  });

export const listMyBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: blocks, error } = await context.supabase
      .from("user_blocks")
      .select("blocked_user_id, created_at")
      .eq("blocker_user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!blocks?.length) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email")
      .in(
        "id",
        blocks.map((b) => b.blocked_user_id),
      );
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return blocks.map((b) => ({
      user_id: b.blocked_user_id,
      created_at: b.created_at,
      name: byId.get(b.blocked_user_id)?.display_name ?? byId.get(b.blocked_user_id)?.email ?? "Blocked member",
    }));
  });

export const submitReport = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      targetType: ReportTargetType;
      targetId: string;
      athleteId?: string | null;
      reportedUserId?: string | null;
      reason: string;
      details?: string;
    }) => {
      if (!data?.targetType || !data?.targetId) throw new Error("Nothing to report");
      if (!data.reason?.trim()) throw new Error("Pick a reason");
      if ((data.details ?? "").length > 2000) throw new Error("Please shorten the details");
      return data;
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("content_reports").insert({
      reporter_user_id: context.userId,
      target_type: data.targetType,
      target_id: data.targetId,
      athlete_id: data.athleteId ?? null,
      reported_user_id: data.reportedUserId ?? null,
      reason: data.reason,
      details: data.details?.trim() || null,
    });
    if (error) throw new Error(error.message);

    // Notify admins so the queue does not go unnoticed.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.user_id,
          type: "report",
          title: "New content report",
          body: `${data.reason} — reported ${data.targetType.replace("_", " ")}.`,
          link: "/admin/reports",
        })),
      );
    }
    return { reported: true };
  });

export const listContentReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContentReportRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: reports, error } = await supabaseAdmin
      .from("content_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const userIds = new Set<string>();
    const athleteIds = new Set<string>();
    const messageIds: string[] = [];
    for (const r of reports ?? []) {
      userIds.add(r.reporter_user_id);
      if (r.reported_user_id) userIds.add(r.reported_user_id);
      if (r.athlete_id) athleteIds.add(r.athlete_id);
      if (r.target_type === "message") messageIds.push(r.target_id);
    }

    const [{ data: profiles }, { data: athletes }, { data: messages }] = await Promise.all([
      userIds.size
        ? supabaseAdmin.from("profiles").select("id, email, display_name").in("id", [...userIds])
        : Promise.resolve({ data: [] as any[] }),
      athleteIds.size
        ? supabaseAdmin.from("athletes").select("id, full_name").in("id", [...athleteIds])
        : Promise.resolve({ data: [] as any[] }),
      messageIds.length
        ? supabaseAdmin.from("messages").select("id, body").in("id", messageIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const aMap = new Map((athletes ?? []).map((a: any) => [a.id, a]));
    const mMap = new Map((messages ?? []).map((m: any) => [m.id, m]));

    return (reports ?? []).map((r) => ({
      id: r.id,
      target_type: r.target_type as ReportTargetType,
      target_id: r.target_id,
      athlete_id: r.athlete_id,
      reported_user_id: r.reported_user_id,
      reason: r.reason,
      details: r.details,
      status: r.status as ContentReportRow["status"],
      resolution_note: r.resolution_note,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      reporter_email:
        pMap.get(r.reporter_user_id)?.email ?? pMap.get(r.reporter_user_id)?.display_name ?? null,
      reported_email: r.reported_user_id
        ? (pMap.get(r.reported_user_id)?.email ?? pMap.get(r.reported_user_id)?.display_name ?? null)
        : null,
      athlete_name: r.athlete_id ? (aMap.get(r.athlete_id)?.full_name ?? null) : null,
      message_body: r.target_type === "message" ? (mMap.get(r.target_id)?.body ?? null) : null,
    }));
  });

export const resolveReport = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { id: string; status: "open" | "reviewed" | "actioned" | "dismissed"; note?: string }) => {
      if (!data?.id) throw new Error("Missing report");
      return data;
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("content_reports")
      .update({
        status: data.status,
        resolution_note: data.note?.trim() || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin action: hide a reported athlete profile from the public directory. */
export const unpublishReportedAthlete = createServerFn({ method: "POST" })
  .inputValidator((data: { athleteId: string }) => {
    if (!data?.athleteId) throw new Error("Missing athlete");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("athletes")
      .update({ is_published: false })
      .eq("id", data.athleteId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
