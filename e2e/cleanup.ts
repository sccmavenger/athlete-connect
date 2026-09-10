import "dotenv/config";
import { sweepTestData } from "./helpers/cleanup";

const { deletedUsers } = await sweepTestData();
console.log(`[cleanup] removed ${deletedUsers} throwaway test account(s)`);
