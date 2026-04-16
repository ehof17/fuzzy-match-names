import pg from "pg";

declare module "nitropack" {
  interface NitroApp {
    db: pg.Pool;
  }
}

export default defineNitroPlugin((nitroApp) => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  pool.on("error", (err) => {
    console.error("Postgres pool error:", err);
  });

  nitroApp.db = pool;

  nitroApp.hooks.hook("close", async () => {
    await pool.end();
  });
});
