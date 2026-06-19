export type PapelUsuario = "admin" | "viewer";

export type TipoDispositivo = "ar_condicionado" | "servidor" | "iluminacao" | "outro";

export interface Setor {
  id: number;
  nome: string;
  createdAt: string;
}

export interface Dispositivo {
  id: number;
  setorId: number;
  nome: string;
  tipo: TipoDispositivo;
  limiteConsumoW: number | null;
  ativo: boolean;
  createdAt: string;
}

export interface LeituraConsumo {
  tempo: string;
  dispositivoId: number;
  consumoW: number;
}

// Payload publicado pelo simulador em dispositivos/{id}/consumo
export interface LeituraConsumoPayload {
  consumoW: number;
  timestamp: string;
}

// Payload publicado pelo backend em dispositivos/{id}/comando
export type ComandoAcao = "ligar" | "desligar";

export interface ComandoDispositivoPayload {
  acao: ComandoAcao;
  emitidoEm: string;
}

export interface Usuario {
  id: number;
  email: string;
  papel: PapelUsuario;
  createdAt: string;
}

export const SHARED_TYPES_VERSION = "0.2.0";