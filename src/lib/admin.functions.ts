import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["admin", "coach", "athlete", "parent"] as const;
export type AdminRole = (typeof ROLES)[number];

export interface AdminUserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: AdminRole[];
  athlete_count: number;
  is_published: boolean;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authError) throw new Error(authError.message);

    const [{ data: profiles }, { data: roleRows }, { data: athletes }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, email"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("athletes").select("id, user_id, is_published"),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return authUsers.users
      .map((u) => {
        const p = profileMap.get(u.id);
        const roles = (roleRows ?? [])
          .filter((r) => r.user_id === u.id)
          .map((r) => r.role as AdminRole);
        const mine = (athletes ?? []).filter((a) => a.user_id === u.id);
        return {
          id: u.id,
          email: u.email ?? p?.email ?? null,
          display_name: p?.display_name ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          roles,
          athlete_count: mine.length,
          is_published: mine.some((a) => a.is_published),
        };
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId || typeof input.userId !== "string") throw new Error("userId required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAdminUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; roles: string[] }) => {
    if (!input?.userId || typeof input.userId !== "string") throw new Error("userId required");
    if (!Array.isArray(input.roles)) throw new Error("roles required");
    const roles = input.roles.filter((r): r is AdminRole => (ROLES as readonly string[]).includes(r));
    return { userId: input.userId, roles };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && !data.roles.includes("admin")) {
      throw new Error("You cannot remove your own admin role");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (delError) throw new Error(delError.message);

    if (data.roles.length > 0) {
      const { error: insError } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((role) => ({ user_id: data.userId, role })));
      if (insError) throw new Error(insError.message);
    }
    return { ok: true, roles: data.roles };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const count = async (table: string, filter?: (q: any) => any) => {
      let q = supabaseAdmin.from(table as any).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: c } = await q;
      return c ?? 0;
    };

    const [users, athletes, published, pendingCoaches, coaches, messages] = await Promise.all([
      count("profiles"),
      count("athletes"),
      count("athletes", (q) => q.eq("is_published", true)),
      count("coach_requests", (q) => q.eq("status", "pending")),
      count("user_roles", (q) => q.eq("role", "coach")),
      count("messages"),
    ]);

    return { users, athletes, published, pendingCoaches, coaches, messages };
  });
