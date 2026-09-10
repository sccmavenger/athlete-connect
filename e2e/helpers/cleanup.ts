import { adminClient } from "./admin";

/**
 * Removes every throwaway account the suite creates (emails look like
 * `e2e-<slug>-<timestamp>@example.com`) plus any data that hangs off them.
 * Safe to run repeatedly; it never touches real accounts.
 */
export async function sweepTestData(): Promise<{ deletedUsers: number }> {
  const admin = adminClient();
  let deleted = 0;

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data.users ?? [];
    if (users.length === 0) break;

    for (const u of users) {
      const email = (u.email ?? "").toLowerCase();
      if (!email.startsWith("e2e-") || !email.endsWith("@example.com")) continue;
      await admin.from("content_reports").delete().eq("reporter_user_id", u.id);
      await admin.from("content_reports").delete().eq("reported_user_id", u.id);
      await admin.from("user_blocks").delete().eq("blocker_user_id", u.id);
      await admin.from("user_blocks").delete().eq("blocked_user_id", u.id);
      await admin.auth.admin.deleteUser(u.id).catch(() => undefined);
      deleted++;
    }
    if (users.length < 200) break;
  }

  // Orphaned athlete rows from earlier aborted runs.
  await admin.from("athletes").delete().like("full_name", "E2E %");
  return { deletedUsers: deleted };
}
