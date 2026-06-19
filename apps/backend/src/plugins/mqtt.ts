import fp from "fastify-plugin";
import mqtt from "mqtt";
import type { FastifyInstance } from "fastify";
import type { LeituraConsumoPayload } from "@energy-monitor/shared-types";
import { calcularCusto } from "../services/custo.js";
import { emitirParaTodos } from "../services/socket.js";

// Custo acumulado por dispositivo (em memória, reinicia com o servidor)
// Na etapa de histórico, isso vai ser consultado do banco
const custoAcumulado: Record<number, number> = {};
const ultimaLeitura: Record<number, { timestamp: number; consumoW: number }> = {};

export default fp(async (fastify: FastifyInstance) => {
  const client = mqtt.connect(
    `mqtt://${process.env.MQTT_HOST ?? "localhost"}:${process.env.MQTT_PORT ?? "1883"}`,
    {
      username: process.env.MQTT_BACKEND_USERNAME,
      password: process.env.MQTT_BACKEND_PASSWORD,
      clientId: `backend-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
    }
  );

  client.on("connect", () => {
    fastify.log.info("MQTT: conectado ao broker");

    client.subscribe("dispositivos/+/consumo", (err) => {
      if (err) fastify.log.error("MQTT: erro ao assinar tópicos", err);
      else fastify.log.info("MQTT: assinando dispositivos/+/consumo");
    });
  });

  client.on("message", async (topico, mensagem) => {
    const partes = topico.split("/");
    const dispositivoId = Number(partes[1]);

    let payload: LeituraConsumoPayload;
    try {
      payload = JSON.parse(mensagem.toString()) as LeituraConsumoPayload;
    } catch {
      fastify.log.warn(`MQTT: payload inválido no tópico ${topico}`);
      return;
    }

    const agora = Date.now();
    const anterior = ultimaLeitura[dispositivoId];
    const intervaloMs = anterior ? agora - anterior.timestamp : 5000;

    // Calcula o custo do intervalo desde a última leitura
    const custoIntervalo = calcularCusto(payload.consumoW, intervaloMs);
    custoAcumulado[dispositivoId] = (custoAcumulado[dispositivoId] ?? 0) + custoIntervalo;

    ultimaLeitura[dispositivoId] = { timestamp: agora, consumoW: payload.consumoW };

    // Grava no TimescaleDB
    try {
      await fastify.db.query(
        `INSERT INTO leituras_consumo (tempo, dispositivo_id, consumo_w)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [payload.timestamp, dispositivoId, payload.consumoW]
      );
    } catch (err) {
      fastify.log.error("DB: erro ao gravar leitura", err);
      return;
    }

    // Verifica se ultrapassou o limite e emite alerta
    const limiteResult = await fastify.db.query<{ limite_consumo_w: number | null }>(
      "SELECT limite_consumo_w FROM dispositivos WHERE id = $1",
      [dispositivoId]
    );

    const limite = limiteResult.rows[0]?.limite_consumo_w;
    if (limite && payload.consumoW > limite) {
      emitirParaTodos({
        tipo: "alerta",
        dispositivoId,
        mensagem: `Consumo de ${payload.consumoW}W ultrapassou o limite de ${limite}W`,
        timestamp: payload.timestamp,
      });
    }

    // Emite leitura pro dashboard via WebSocket
    emitirParaTodos({
      tipo: "leitura",
      dispositivoId,
      consumoW: payload.consumoW,
      custoAcumuladoR$: Number(custoAcumulado[dispositivoId]?.toFixed(4)),
      timestamp: payload.timestamp,
    });
  });

  client.on("error", (err) => {
    fastify.log.error("MQTT: erro de conexão", err.message);
  });

  // Expõe o client pra a rota de comandos conseguir publicar
  fastify.decorate("mqtt", client);

  fastify.addHook("onClose", async () => {
    client.end();
  });
});