import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily("refresh google reviews", { hourUTC: 12, minuteUTC: 0 }, internal.reviews.refresh);
export default crons;
