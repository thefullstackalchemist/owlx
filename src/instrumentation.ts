export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { seedFirstUser } = await import("@/lib/seed");
      await seedFirstUser();
    } catch (err) {
      console.error("[owl] seedFirstUser failed:", err);
    }
    try {
      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
      if (webhookUrl) {
        // Production: register webhook with Telegram, bot responds via HTTP
        const { registerWebhook } = await import("@/services/telegram");
        await registerWebhook(webhookUrl);
      } else {
        // Development: long-poll from this process
        const { startTelegramBot } = await import("@/services/telegram");
        startTelegramBot();
      }
    } catch (err) {
      console.error("[owl] Telegram bot failed to start:", err);
    }
    try {
      const { startReminderCron } = await import("@/services/reminderCron");
      startReminderCron();
    } catch (err) {
      console.error("[owl] Reminder cron failed to start:", err);
    }
  }
}
