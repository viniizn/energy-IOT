import fp from "fastify-plugin";
import pg from "pg";
import type { FastifyInstance } from "fastify";

const { Pool } = pg;

export default fp(async (fastify: FastifyInstance) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query("SELECT 1");
  fastify.log.info("Conectado ao TimescaleDB");

  fastify.decorate("db", pool);

  fastify.addHook("onClose", async () => {
    await pool.end();
  });
});