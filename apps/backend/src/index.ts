import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import dbPlugin from "./plugins/db.js";
import jwtPlugin from "./plugins/jwt.js";
import corsPlugin from "./plugins/cors.js";
import mqttPlugin from "./plugins/mqtt.js";

import authRoutes from "./routes/auth.js";
import dispositivosRoutes from "./routes/dispositivos.js";
import leiturasRoutes from "./routes/leituras.js";
import comandosRoutes from "./routes/comandos.js";
import wsRoutes from "./routes/ws.js";

const PORT = Number(process.env.BACKEND_PORT ?? 3000);

const app = Fastify({ logger: true });

await app.register(corsPlugin);
await app.register(dbPlugin);
await app.register(jwtPlugin);
await app.register(fastifyWebsocket);
await app.register(mqttPlugin);

app.get("/health", async () => ({
  status: "ok",
  service: "energy-monitor-backend",
  timestamp: new Date().toISOString(),
}));

await app.register(authRoutes);
await app.register(dispositivosRoutes);
await app.register(leiturasRoutes);
await app.register(comandosRoutes);
await app.register(wsRoutes);

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`Backend rodando em http://localhost:${PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });