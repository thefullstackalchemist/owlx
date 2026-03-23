export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { seedFirstUser } = await import("@/lib/seed");
      await seedFirstUser();
    } catch (err) {
      console.error("[owl] seedFirstUser failed:", err);
    }
  }
}
