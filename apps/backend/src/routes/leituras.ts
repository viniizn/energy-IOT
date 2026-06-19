import type { FastifyInstance } from "fastify";

export default async function leiturasRoutes(fastify: FastifyInstance) {
  
    // Histórico de leituras de um dispositivo
  fastify.get<{
    Querystring: { dispositivoId: string; de?: string; ate?: string };
  }>("/leituras", {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: "object",
        required: ["dispositivoId"],
        properties: {
          dispositivoId: { type: "string" },
          de: { type: "string" },
          ate: { type: "string" },
        },
      },
    },
  }, async (request) => {
    const { dispositivoId, de, ate } = request.query;

    const result = await fastify.db.query(
      `SELECT tempo, consumo_w
       FROM leituras_consumo
       WHERE dispositivo_id = $1
         AND tempo >= $2
         AND tempo <= $3
       ORDER BY tempo ASC
       LIMIT 1000`,
      [
        dispositivoId,
        de ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ate ?? new Date().toISOString(),
      ]
    );

    return result.rows;
  });

  // Histórico agregado por hora (usa a materialized view do TimescaleDB)
  fastify.get<{
    Querystring: { dispositivoId: string };
  }>("/leituras/resumo-horario", {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: "object",
        required: ["dispositivoId"],
        properties: {
          dispositivoId: { type: "string" },
        },
      },
    },
  }, async (request) => {
    const result = await fastify.db.query(
      `SELECT hora, consumo_medio_w, consumo_max_w
       FROM consumo_por_hora
       WHERE dispositivo_id = $1
       ORDER BY hora DESC
       LIMIT 168`, // últimas 168 horas = 7 dias
      [request.query.dispositivoId]
    );

    return result.rows;
  });
}