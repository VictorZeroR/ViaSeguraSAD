import { describe, expect, it } from "vitest";
import { gerarBase } from "@/lib/data";
import { decidir, nomearClusters, CLUSTER_VARS } from "@/lib/sad";
import { kmeans, ols, pearson, zscore } from "@/lib/stats";

const dados = gerarBase();
const rows = zscore(CLUSTER_VARS.map((v) => dados.map((d) => d[v])));
const { labels } = kmeans(rows, 4);
const clusters = nomearClusters(dados, labels, 4);
const modelo = ols(dados.map((d) => [d.pctJovens, d.pctIdosos, d.frota]), dados.map((d) => d.acidentes), ["J", "I", "F"]);
const pesos = { acidentes: 0.35, mortalidade: 0.3, jovens: 0.2, frota: 0.15 };
const custos = { fiscalizacao: 450000, campanha: 180000, monitoramento: 60000 };

describe("ViaSegura SAD", () => {
  it("gera 100 municípios com correlação positiva frota/acidentes", () => {
    expect(dados).toHaveLength(100);
    expect(pearson(dados.map((d) => d.frota), dados.map((d) => d.acidentes)).r).toBeGreaterThan(0.5);
  });
  it("nunca ultrapassa o orçamento", () => {
    const rec = decidir(dados, labels, clusters, modelo, pesos, custos, 3000000, 0.5);
    expect(rec.filter((r) => r.financiado).reduce((a, b) => a + b.custo, 0)).toBeLessThanOrEqual(3000000);
  });
  it("aplica fiscalização só em alto risco acima do limiar", () => {
    const rec = decidir(dados, labels, clusters, modelo, pesos, custos, 1e9, 0.5);
    for (const r of rec.filter((x) => x.acao.startsWith("Fiscal"))) expect(r.indice).toBeGreaterThan(0.5);
  });
});
