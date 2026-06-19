import type { FastifyInstance } from "fastify";

export default async function dispositivosRoutes(fastify: FastifyInstance) {
  // Lista todos os dispositivos com o nome do setor
  fastify.get("/dispositivos", {
    preHandler: [fastify.authenticate],
  }, async () => {
    const result = await fastify.db.query(
      `SELECT d.id, d.nome, d.tipo, d.limite_consumo_w, d.ativo, s.nome AS setor
       FROM dispositivos d
       JOIN setores s ON s.id = d.setor_id
       ORDER BY s.nome, d.nome`
    );
    return result.rows;
  });

  // Detalhe de um dispositivo específico
  fastify.get<{ Params: { id: string } }>("/dispositivos/:id", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const result = await fastify.db.query(
      `SELECT d.id, d.nome, d.tipo, d.limite_consumo_w, d.ativo, s.nome AS setor
       FROM dispositivos d
       JOIN setores s ON s.id = d.setor_id
       WHERE d.id = $1`,
      [request.params.id]
    );

    if (!result.rows[0]) {
      return reply.code(404).send({ error: "Dispositivo não encontrado" });
    }

    return result.rows[0];
  });
}