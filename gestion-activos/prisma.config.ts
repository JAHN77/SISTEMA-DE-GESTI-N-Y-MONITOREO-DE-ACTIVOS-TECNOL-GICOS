import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.argv.some(arg => ['migrate', 'db', 'push', 'status', 'generate'].includes(arg))
      ? env("DIRECT_URL")
      : env("DATABASE_URL"),
  },
});
