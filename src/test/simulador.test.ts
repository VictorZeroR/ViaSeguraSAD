import { describe, expect, it } from "vitest";
import { gerarBase } from "@/lib/data";
import { ALAVANCAS, calcularCenario, deltasZerados, parametrosIniciais, sugerirAcoes } from "@/lib/simulador";

const dados = gerarBase();

 describe("Simulador de cenários", () => {
  it("gera as seis alavancas de forma fixa e não negativa para os 100 municípios", () => {
    expect(dados).toHaveLength(100);
    expect(gerarBase()).toEqual(dados);
    for (const municipio of dados) {
      for (const { key } of ALAVANCAS) expect(municipio[key]).toBeGreaterThanOrEqual(0);
    }
  });

  it("dez faixas a mais reduzem 0,3% dos acidentes e 0,8% da mortalidade com os efeitos iniciais", () => {
    const municipio = dados[0];
    const resultado = calcularCenario(municipio, { ...deltasZerados(), faixasPedestres: 10 }, parametrosIniciais());
    expect(resultado.acidentes).toBeCloseTo(municipio.acidentes * 0.997);
    expect(resultado.mortalidade).toBeCloseTo(municipio.mortalidade * 0.992);
  });

  it("100 multas reduzem 0,12% dos acidentes e 0,08% da mortalidade, ao custo de R$ 12 mil", () => {
    const municipio = dados[0];
    const resultado = calcularCenario(municipio, { ...deltasZerados(), multasAplicadas: 100 }, parametrosIniciais());
    expect(resultado.acidentes).toBeCloseTo(municipio.acidentes * 0.9988);
    expect(resultado.mortalidade).toBeCloseTo(municipio.mortalidade * 0.9992);
    expect(resultado.investimento).toBe(12000);
  });

  it("sugere três ações dentro do orçamento, ordenadas por mortes evitadas por milhão", () => {
    const municipio = dados[0];
    const sugestoes = sugerirAcoes(municipio, dados.slice(0, 12), parametrosIniciais(), 1000000);
    expect(sugestoes).toHaveLength(3);
    for (const sugestao of sugestoes) expect(sugestao.custo).toBeLessThanOrEqual(1000000);
    expect(sugestoes[0].porMilhao).toBeGreaterThanOrEqual(sugestoes[1].porMilhao);
    expect(sugestoes[1].porMilhao).toBeGreaterThanOrEqual(sugestoes[2].porMilhao);
  });
});
