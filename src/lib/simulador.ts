import type { Municipio } from "./data";
import { mean } from "./stats";

export type AlavancaKey = "fotossensores" | "semaforos" | "faixasPedestres" | "kmCalcadas" | "motofaixas" | "multasAplicadas";
export type Deltas = Record<AlavancaKey, number>;
export interface ParametroAlavanca {
  acidentes: number;
  mortalidade: number;
  custo: number;
}
export type Parametros = Record<AlavancaKey, ParametroAlavanca>;

export const ALAVANCAS: Array<{
  key: AlavancaKey;
  label: string;
  unidade: string;
  passo: number;
  pacote: number;
}> = [
  { key: "fotossensores", label: "Fotossensores (radares)", unidade: "equipamentos", passo: 1, pacote: 5 },
  { key: "semaforos", label: "Semáforos", unidade: "equipamentos", passo: 1, pacote: 5 },
  { key: "faixasPedestres", label: "Faixas de pedestres", unidade: "faixas", passo: 5, pacote: 20 },
  { key: "kmCalcadas", label: "Calçadas", unidade: "km", passo: 0.5, pacote: 5 },
  { key: "motofaixas", label: "Motofaixas", unidade: "km", passo: 0.5, pacote: 3 },
  { key: "multasAplicadas", label: "Multas aplicadas", unidade: "multas", passo: 100, pacote: 500 },
];

export const parametrosIniciais = (): Parametros => ({
  fotossensores: { acidentes: -0.8, mortalidade: -1, custo: 90000 },
  semaforos: { acidentes: -0.25, mortalidade: -0.2, custo: 120000 },
  faixasPedestres: { acidentes: -0.03, mortalidade: -0.08, custo: 3500 },
  kmCalcadas: { acidentes: -0.015, mortalidade: -0.04, custo: 250000 },
  motofaixas: { acidentes: -0.3, mortalidade: -0.6, custo: 180000 },
  multasAplicadas: { acidentes: -0.12, mortalidade: -0.08, custo: 12000 },
});

export const deltasZerados = (): Deltas => ({
  fotossensores: 0,
  semaforos: 0,
  faixasPedestres: 0,
  kmCalcadas: 0,
  motofaixas: 0,
  multasAplicadas: 0,
});

export const valorAlavanca = (m: Municipio, key: AlavancaKey) => m[key] ?? 0;
export const por100mil = (valor: number, populacao: number) => (valor / Math.max(1, populacao)) * 100000;

export function limiteSlider(m: Municipio, key: AlavancaKey) {
  const atual = valorAlavanca(m, key);
  if (key === "fotossensores") return Math.max(10, Math.ceil(atual * 0.5));
  if (key === "semaforos") return Math.max(20, Math.ceil(atual * 0.5));
  if (key === "faixasPedestres") return Math.max(100, Math.ceil((atual * 0.5) / 5) * 5);
  if (key === "kmCalcadas") return Math.max(20, Math.ceil(atual * 0.25));
  if (key === "motofaixas") return Math.max(10, Math.ceil(atual * 0.5));
  return Math.max(1000, Math.ceil((atual * 0.5) / 100) * 100);
}

export function calcularCenario(m: Municipio, deltas: Deltas, parametros: Parametros) {
  let variacaoAcidentes = 0;
  let variacaoMortalidade = 0;
  let investimento = 0;
  for (const { key } of ALAVANCAS) {
    const unidades = key === "multasAplicadas" ? deltas[key] / 100 : deltas[key];
    variacaoAcidentes += (unidades * parametros[key].acidentes) / 100;
    variacaoMortalidade += (unidades * parametros[key].mortalidade) / 100;
    investimento += Math.max(0, unidades) * parametros[key].custo;
  }
  const acidentes = m.acidentes * Math.min(2, Math.max(0, 1 + variacaoAcidentes));
  const mortalidade = m.mortalidade * Math.min(2, Math.max(0, 1 + variacaoMortalidade));
  return {
    acidentes,
    mortalidade,
    deltaAcidentes: acidentes - m.acidentes,
    deltaMortalidade: mortalidade - m.mortalidade,
    mortes: (mortalidade * m.populacao) / 100000,
    mortesBase: (m.mortalidade * m.populacao) / 100000,
    investimento,
  };
}

export interface Sugestao {
  key: AlavancaKey;
  quantidade: number;
  custo: number;
  acidentesEvitados: number;
  mortesEvitadas: number;
  reducaoMortalidade: number;
  porMilhao: number;
  abaixoDoGrupo: boolean;
  taxaAtual: number;
  taxaGrupo: number;
}

export function sugerirAcoes(m: Municipio, grupo: Municipio[], parametros: Parametros, orcamento: number): Sugestao[] {
  const mortesBase = (m.mortalidade * m.populacao) / 100000;
  const sugestoes = ALAVANCAS.map((a) => {
    const atual = valorAlavanca(m, a.key);
    const taxaAtual = por100mil(atual, m.populacao);
    const taxaGrupo = mean(grupo.map((g) => por100mil(valorAlavanca(g, a.key), g.populacao)));
    const gap = Math.max(0, ((taxaGrupo - taxaAtual) * m.populacao) / 100000);
    const desejada = gap >= a.passo ? Math.ceil(gap / a.passo) * a.passo : a.pacote;
    const custoPorPasso = a.key === "multasAplicadas" ? parametros[a.key].custo : parametros[a.key].custo * a.passo;
    const disponivel = Math.max(0, Math.floor(orcamento / Math.max(1, custoPorPasso)) * a.passo);
    const quantidade = Math.min(desejada, disponivel);
    const unidades = a.key === "multasAplicadas" ? quantidade / 100 : quantidade;
    const custo = unidades * parametros[a.key].custo;
    const acidentesEvitados = Math.min(m.acidentes, Math.max(0, (-unidades * parametros[a.key].acidentes * m.acidentes) / 100));
    const mortesEvitadas = Math.min(mortesBase, Math.max(0, (-unidades * parametros[a.key].mortalidade * mortesBase) / 100));
    const reducaoMortalidade = Math.min(m.mortalidade, Math.max(0, (-unidades * parametros[a.key].mortalidade * m.mortalidade) / 100));
    return {
      key: a.key,
      quantidade,
      custo,
      acidentesEvitados,
      mortesEvitadas,
      reducaoMortalidade,
      porMilhao: custo > 0 ? (mortesEvitadas / custo) * 1000000 : 0,
      abaixoDoGrupo: gap >= a.passo,
      taxaAtual,
      taxaGrupo,
    };
  }).filter((s) => s.quantidade > 0 && s.custo <= orcamento);

  return sugestoes.sort((a, b) =>
    b.porMilhao - a.porMilhao || (b.acidentesEvitados / b.custo) - (a.acidentesEvitados / a.custo),
  ).slice(0, 3);
}
