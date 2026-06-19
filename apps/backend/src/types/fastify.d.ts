import type { Pool } from "pg";
import type { MqttClient } from "mqtt";

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
    mqtt: MqttClient;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      id: number;
      email: string;
      papel: "admin" | "viewer";
    };
  }
}