import mqtt from "mqtt";
import dotenv from "dotenv";
import type {
  LeituraConsumoPayload,
  ComandoDispositivoPayload,
} from "@energy-monitor/shared-types";

dotenv.config({ path: new URL("../../../.env", import.meta.url).pathname });

// Configuração do broker
const MQTT_HOST = process.env.MQTT_HOST ?? "localhost";
const MQTT_PORT = process.env.MQTT_PORT ?? "1883";
const USERNAME = process.env.MQTT_SIMULATOR_USERNAME;
const PASSWORD = process.env.MQTT_SIMULATOR_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error("[simulator] MQTT_SIMULATOR_USERNAME e MQTT_SIMULATOR_PASSWORD precisam estar definidos no .env");
  process.exit(1);
}

type DispositivoSimulado = {
  id: number;
  nome: string;
  consumoBaseW: number;
  variacaoW: number;
  ativo: boolean;
};

const dispositivos: DispositivoSimulado[] = [
  { id: 1, nome: "Ar Condicionado - Sala 1", consumoBaseW: 1800, variacaoW: 400, ativo: true },
  { id: 2, nome: "Servidor Principal",       consumoBaseW: 350,  variacaoW: 150, ativo: true },
  { id: 3, nome: "Iluminação - Andar 1",     consumoBaseW: 250,  variacaoW: 100, ativo: true },
];

// Gera um valor de consumo aleatório dentro da faixa do dispositivo
function gerarConsumo(dispositivo: DispositivoSimulado): number {
  if (!dispositivo.ativo) return 0;
  const metade = dispositivo.variacaoW / 2;
  const variacao = (Math.random() * dispositivo.variacaoW) - metade;
  return Math.max(0, Math.round(dispositivo.consumoBaseW + variacao));
}

const client = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`, {
  username: USERNAME,
  password: PASSWORD,
  clientId: `simulator-${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
});

client.on("connect", () => {
  console.log("[simulator] Conectado ao broker MQTT");

  // Assina o tópico de comando de todos os dispositivos
  client.subscribe("dispositivos/+/comando", (err) => {
    if (err) {
      console.error("[simulator] Erro ao assinar tópico de comandos:", err.message);
    } else {
      console.log("[simulator] Assinando: dispositivos/+/comando");
    }
  });

  // Publica leituras a cada 5 segundos
  setInterval(() => {
    for (const dispositivo of dispositivos) {
      const payload: LeituraConsumoPayload = {
        consumoW: gerarConsumo(dispositivo),
        timestamp: new Date().toISOString(),
      };

      const topico = `dispositivos/${dispositivo.id}/consumo`;
      client.publish(topico, JSON.stringify(payload), { qos: 1 });

      console.log(`[simulator] ${dispositivo.nome}: ${payload.consumoW}W → ${topico}`);
    }
  }, 5000);
});

// Recebe comandos de ligar/desligar do backend
client.on("message", (topico, mensagem) => {
  const partes = topico.split("/");
  const dispositivoId = Number(partes[1]);

  const dispositivo = dispositivos.find((d) => d.id === dispositivoId);
  if (!dispositivo) return;

  try {
    const comando = JSON.parse(mensagem.toString()) as ComandoDispositivoPayload;
    dispositivo.ativo = comando.acao === "ligar";
    console.log(`[simulator] Comando recebido — ${dispositivo.nome}: ${comando.acao.toUpperCase()}`);
  } catch {
    console.error(`[simulator] Payload inválido no tópico ${topico}:`, mensagem.toString());
  }
});

client.on("error", (err) => {
  console.error("[simulator] Erro de conexão:", err.message);
});

client.on("disconnect", () => {
  console.log("[simulator] Desconectado do broker");
});