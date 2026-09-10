import "dotenv/config";
import { sweepTestData } from "./helpers/cleanup";

/** Playwright global teardown: guarantees no test data survives a run. */
export default async function globalTeardown() {
  try {
    const { deletedUsers } = await sweepTestData();
    console.log(`[cleanup] removed ${deletedUsers} throwaway test account(s)`);
  } catch (e) {
    console.warn("[cleanup] sweep failed:", e instanceof Error ? e.message : e);
  }
}
