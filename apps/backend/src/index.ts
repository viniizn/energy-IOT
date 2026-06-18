import Fastify from "fastify";
import cors from "@fastify/cors";
import { SHARED_TYPES_VERSION } from "@energy-monitor/shared-types";

const PORT = Number(process.env.BACKEND_PORT ?? 3000);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
});

app.get("/health", async () => {
    return {
        status: "ok",
        service: "energy-monitor-backend",
        sharedTypesVersion: SHARED_TYPES_VERSION,
        timestamp: new Date().toISOString(),
    };
});

app
    .listen({ port: PORT, host: "0.0.0.0" })
    .then(() => app.log.info(`Backend rodando em http://localhost:${PORT}`))
    .catch((err) => {
    app.log.error(err);
    process.exit(1);
    });