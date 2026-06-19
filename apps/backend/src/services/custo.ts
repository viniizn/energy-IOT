const TARIFA_KWH = 0.75;

export function calcularCusto(consumoW: number, intervaloMs: number): number {
  const horas = intervaloMs / 1000 / 3600;
  const kwh = (consumoW * horas) / 1000;
  return kwh * TARIFA_KWH;
}