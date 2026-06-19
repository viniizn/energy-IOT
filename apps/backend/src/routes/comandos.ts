import type { FastifyInstance } from "fastify";
import type { ComandoDispositivoPayload } from "@energy-monitor/shared-types";

export default async function comandosRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Params: { id: string };
    Body: { acao: "ligar" | "desligar" };
  }>("/dispositivos/:id/comando", {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: "object",
        required: ["acao"],
        properties: {
          acao: { type: "string", enum: ["ligar", "desligar"] },
        },
      },
    },
  }, async (request, reply) => {
    // Só admin pode mandar comandos
    if (request.user.papel !== "admin") {
      return reply.code(403).send({ error: "Apenas administradores podem enviar comandos" });
    }

    const dispositivoId = Number(request.params.id);

    // Confirma que o dispositivo existe
    const result = await fastify.db.query(
      "SELECT id FROM dispositivos WHERE id = $1",
      [dispositivoId]
    );

    if (!result.rows[0]) {
      return reply.code(404).send({ error: "Dispositivo não encontrado" });
    }

    const payload: ComandoDispositivoPayload = {
      acao: request.body.acao,
      emitidoEm: new Date().toISOString(),
    };

    fastify.mqtt.publish(
      `dispositivos/${dispositivoId}/comando`,
      JSON.stringify(payload),
      { qos: 1 }
    );

    return { ok: true, dispositivoId, acao: request.body.acao };
  });
}