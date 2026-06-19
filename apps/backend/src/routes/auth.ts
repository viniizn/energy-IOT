import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: { email: string; senha: string };
  }>("/auth/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "senha"],
        properties: {
          email: { type: "string", format: "email" },
          senha: { type: "string", minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, senha } = request.body;

    const result = await fastify.db.query<{
      id: number; email: string; senha_hash: string; papel: string;
    }>(
      "SELECT id, email, senha_hash, papel FROM usuarios WHERE email = $1",
      [email]
    );

    const usuario = result.rows[0];
    if (!usuario) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }

    const token = fastify.jwt.sign(
      { id: usuario.id, email: usuario.email, papel: usuario.papel },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "8h" }
    );

    return { token };
  });
}