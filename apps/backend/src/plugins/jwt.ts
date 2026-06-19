import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "segredo-nao-definido",
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ error: "Token inválido ou ausente" });
      }
    }
  );
});