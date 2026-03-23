import cron from "node-cron";
import { notify } from "./telegram";

const MORNING_MSG =
  "🌅 *Good morning!* Don't forget to log yesterday's or this morning's expenses.\n\n" +
  "_Reply with something like: \"Coffee 80 today\" or \"Auto 50 yesterday\"_";

const EVENING_MSG =
  "🌙 *Good evening!* Take a moment to log today's expenses before the day ends.\n\n" +
  "_Reply with something like: \"Lunch 150 Swiggy\" or \"Groceries 800 BigBasket\"_";

export function startReminderCron() {
  // 10:00 AM IST every day
  cron.schedule(
    "0 10 * * *",
    async () => {
      console.log("[cron] Sending morning expense reminder");
      await notify(MORNING_MSG).catch((err) =>
        console.error("[cron] Morning reminder failed:", err)
      );
    },
    { timezone: "Asia/Kolkata" }
  );

  // 10:00 PM IST every day
  cron.schedule(
    "0 22 * * *",
    async () => {
      console.log("[cron] Sending evening expense reminder");
      await notify(EVENING_MSG).catch((err) =>
        console.error("[cron] Evening reminder failed:", err)
      );
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("[owl] Reminder cron jobs scheduled (10 AM & 10 PM IST)");
}
