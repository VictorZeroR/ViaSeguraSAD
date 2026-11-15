import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { gerarBase, type Municipio } from "./data";
import { kmeans, mean, ols, zscore, type OLSResult } from "./stats";

export const CLUSTER_VARS = ["acidentes", "pctJovens", "pctIdosos", "frota", "mortalidade"] as const;

export interface ClusterInfo {
  id: number;
  nome: string;
  tipo: "alto" | "idoso" | "medio" | "baixo";
  n: number;
  perfil: Record<(typeof CLUSTER_VARS)[number], number>;
}

export interface Pesos { acidentes: number; mortalidade: number; jovens: number; frota: number }
export interface Custos { fiscalizacao: number; campanha: number; monitoramento: number }

interface Ctx {
  dados: Municipio[];
  setDados: (d: Municipio[]) => void;
  k: number;
  setK: (k: number) => void;
  labels: number[];
  clusters: ClusterInfo[];
  modelo: OLSResult;
  pesos: Pesos; setPesos: (p: Pesos) => void;
  custos: Custos; setCustos: (c: Custos) => void;
  orcamento: number; setOrcamento: (n: number) => void;
  limiar: number; setLimiar: (n: number) => void;
}

const SadContext = createContext<Ctx | null>(null);

export function nomearClusters(dados: Municipio[], labels: number[], k: number): ClusterInfo[] {
  const g = (key: keyof Municipio) => mean(dados.map((d) => d[key] as number));
  const glob = Object.fromEntries(CLUSTER_VARS.map((v) => [v, g(v)])) as ClusterInfo["perfil"];
  const infos = Array.from({ length: k }, (_, id) => {
    const m = dados.filter((_, i) => labels[i] === id);
    const perfil = Object.fromEntries(CLUSTER_VARS.map((v) => [v, mean(m.map((d) => d[v]))])) as ClusterInfo["perfil"];
    const riskScore =
      perfil.acidentes / glob.acidentes + perfil.mortalidade / glob.mortalidade + perfil.pctJovens / glob.pctJovens;
    return { id, n: m.length, perfil, riskScore, idoso: perfil.pctIdosos / glob.pctIdosos };
  });
  const sorted = [...infos].sort((a, b) => b.riskScore - a.riskScore);
  return infos.map((c) => {
    let tipo: ClusterInfo["tipo"];
    let nome: string;
    if (c.idoso > 1.25 && c !== sorted[0]) { tipo = "idoso"; nome = "População envelhecida"; }
    else if (c === sorted[0] || c.riskScore > 3.4) { tipo = "alto"; nome = c.perfil.frota > glob.frota * 1.5 ? "Alto risco — grandes centros" : "Alto risco — jovens condutores"; }
    else if (c.riskScore > 2.8) { tipo = "medio"; nome = "Mortalidade elevada"; }
    else { tipo = "baixo"; nome = "Baixo risco"; }
    return { id: c.id, nome, tipo, n: c.n, perfil: c.perfil };
  });
}

export function SadProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<Municipio[]>(() => gerarBase());
  const [k, setK] = useState(4);
  const [pesos, setPesos] = useState<Pesos>({ acidentes: 0.35, mortalidade: 0.3, jovens: 0.2, frota: 0.15 });
  const [custos, setCustos] = useState<Custos>({ fiscalizacao: 450000, campanha: 180000, monitoramento: 60000 });
  const [orcamento, setOrcamento] = useState(8000000);
  const [limiar, setLimiar] = useState(0.5);

  const { labels, clusters } = useMemo(() => {
    const rows = zscore(CLUSTER_VARS.map((v) => dados.map((d) => d[v])));
    const res = kmeans(rows, k);
    return { labels: res.labels, clusters: nomearClusters(dados, res.labels, k) };
  }, [dados, k]);

  const modelo = useMemo(
    () => ols(dados.map((d) => [d.pctJovens, d.pctIdosos, d.frota]), dados.map((d) => d.acidentes), ["% Jovens", "% Idosos", "Frota"]),
    [dados],
  );

  return (
    <SadContext.Provider value={{ dados, setDados, k, setK, labels, clusters, modelo, pesos, setPesos, custos, setCustos, orcamento, setOrcamento, limiar, setLimiar }}>
      {children}
    </SadContext.Provider>
  );
}

export function useSad() {
  const c = useContext(SadContext);
  if (!c) throw new Error("useSad fora do provider");
  return c;
}

// ---- Decision model ----
export interface Recomendacao {
  rank: number;
  nome: string; uf: string; porte: string;
  cluster: string;
  indice: number;
  previstos: number;
  acao: string;
  custo: number;
  justificativa: string;
  financiado: boolean;
}

export function decidir(
  dados: Municipio[], labels: number[], clusters: ClusterInfo[], modelo: OLSResult,
  pesos: Pesos, custos: Custos, orcamento: number, limiar: number,
): Recomendacao[] {
  const prev = dados.map((d) => Math.max(0, modelo.predict([d.pctJovens, d.pctIdosos, d.frota])));
  const nrm = (x: number[]) => { const mn = Math.min(...x), mx = Math.max(...x); return x.map((v) => (v - mn) / (mx - mn || 1)); };
  const nP = nrm(prev), nM = nrm(dados.map((d) => d.mortalidade)), nJ = nrm(dados.map((d) => d.pctJovens)), nF = nrm(dados.map((d) => d.frota));
  const tot = pesos.acidentes + pesos.mortalidade + pesos.jovens + pesos.frota || 1;
  const idx = dados.map((_, i) => (pesos.acidentes * nP[i] + pesos.mortalidade * nM[i] + pesos.jovens * nJ[i] + pesos.frota * nF[i]) / tot);

  const itens = dados.map((d, i) => {
    const c = clusters[labels[i]];
    let acao: string, custo: number, just: string;
    if (c.tipo === "alto" && idx[i] > limiar) {
      acao = "Fiscalização intensiva + educação para jovens"; custo = custos.fiscalizacao;
      just = `${d.porte === "grande" ? "Grande centro" : d.porte === "médio" ? "Cidade média" : "Município pequeno"} com muitos acidentes previstos (${Math.round(prev[i])}) e alta mortalidade (${d.mortalidade} mortes por 100 mil hab.); prioridade para fiscalização e educação de jovens.`;
    } else if (c.tipo === "idoso") {
      acao = "Campanha de renovação de CNH e exames de visão"; custo = custos.campanha;
      just = `Muitos motoristas com 60 anos ou mais (${d.pctIdosos}%); prioridade para renovação da habilitação e exames de visão.`;
    } else if (c.tipo === "alto" || c.tipo === "medio" || idx[i] >= limiar * 0.6) {
      acao = "Monitoramento"; custo = custos.monitoramento;
      just = `Risco intermediário; acompanhar acidentes e mortes (${d.mortalidade} por 100 mil hab.) antes de investir mais.`;
    } else {
      acao = "Sem ação prioritária"; custo = 0;
      just = `Risco baixo em comparação com os demais municípios; sem necessidade de ação agora.`;
    }
    return { nome: d.nome, uf: d.uf, porte: d.porte, cluster: c.nome, indice: idx[i], previstos: Math.round(prev[i]), acao, custo, justificativa: just };
  }).sort((a, b) => b.indice - a.indice);

  let restante = orcamento;
  return itens.map((it, i) => {
    const financiado = it.custo > 0 && it.custo <= restante;
    if (financiado) restante -= it.custo;
    return { ...it, rank: i + 1, financiado };
  });
}
