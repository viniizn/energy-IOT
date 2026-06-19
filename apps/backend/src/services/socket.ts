import type { WebSocket } from "@fastify/websocket";

type EventoSocket =
  | { tipo: "leitura"; dispositivoId: number; consumoW: number; custoAcumuladoR$: number; timestamp: string }
  | { tipo: "alerta"; dispositivoId: number; mensagem: string; timestamp: string }
  | { tipo: "comando"; dispositivoId: number; acao: "ligar" | "desligar" };

const clientes = new Set<WebSocket>();

export function registrarCliente(ws: WebSocket): void {
  clientes.add(ws);
  ws.on("close", () => clientes.delete(ws));
}

export function emitirParaTodos(evento: EventoSocket): void {
  const payload = JSON.stringify(evento);
  for (const cliente of clientes) {
    if (cliente.readyState === 1) { // 1 = OPEN
      cliente.send(payload);
    }
  }
}