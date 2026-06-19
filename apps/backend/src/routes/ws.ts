import type { FastifyInstance } from "fastify";
import { registrarCliente } from "../services/socket.js";

export default async function wsRoutes(fastify: FastifyInstance) {
  fastify.get("/ws", { websocket: true }, (socket) => {
    fastify.log.info("WebSocket: novo cliente conectado");
    registrarCliente(socket);
  });
}