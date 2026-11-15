import { mulberry32 } from "./stats";

export type Porte = "pequeno" | "médio" | "grande";
export interface Municipio {
  nome: string;
  uf: string;
  porte: Porte;
  populacao: number;
  acidentes: number;
  pctJovens: number;
  pctIdosos: number;
  frota: number;
  mortalidade: number;
  fotossensores?: number;
  semaforos?: number;
  faixasPedestres?: number;
  kmCalcadas?: number;
  motofaixas?: number;
  multasAplicadas?: number;
}

const UFS = ["BA", "SP", "MG", "RJ", "PR", "RS", "PE", "CE", "GO", "PA", "SC", "MA", "AM", "ES", "PB"];
const P1 = ["São", "Santa", "Nova", "Vila", "Porto", "Campo", "Monte", "Rio", "Serra", "Lagoa", "Barra", "Alto"];
const P2 = ["Esperança", "Aurora", "Verde", "Bonito", "Alegre", "Claro", "do Sol", "das Flores", "Dourado", "Feliz", "Branco", "Azul", "da Paz", "Formoso", "Grande", "Velho"];

/** Deterministic simulated base (2022) — call lazily, never at module scope. */
export function gerarBase(seed = 2022): Municipio[] {
  const r = mulberry32(seed);
  const norm = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
  const used = new Set<string>();
  const out: Municipio[] = [];
  for (let i = 0; i < 100; i++) {
    let nome = "";
    do nome = `${P1[Math.floor(r() * P1.length)]} ${P2[Math.floor(r() * P2.length)]}`; while (used.has(nome));
    used.add(nome);
    const u = r();
    const porte: Porte = u < 0.55 ? "pequeno" : u < 0.87 ? "médio" : "grande";
    const populacao = Math.round(
      porte === "pequeno" ? 8000 + r() * 42000 : porte === "médio" ? 50000 + r() * 250000 : 300000 + r() * 1200000,
    );
    // Some municipalities age profile: inverse young/old
    const envelhecido = r() < 0.25;
    const pctJovens = +Math.max(6, Math.min(28, (envelhecido ? 10 : 15.5) + norm() * 2.8)).toFixed(1);
    const pctIdosos = +Math.max(5, Math.min(35, (envelhecido ? 24 : 14) + norm() * 3.2)).toFixed(1);
    const veicPorHab = Math.max(0.2, 0.42 + (porte === "grande" ? 0.12 : porte === "médio" ? 0.05 : 0) + norm() * 0.07);
    const frota = Math.round(populacao * veicPorHab);
    const acidentes = Math.max(
      5,
      Math.round(frota * (0.0045 + (pctJovens - 15) * 0.00035 + (pctIdosos - 15) * 0.00006) * (1 + norm() * 0.12) + 20 + norm() * 15),
    );
    const mortalidade = +Math.max(4, 14 + (pctJovens - 15) * 0.6 + (pctIdosos - 15) * 0.25 + (porte === "pequeno" ? 4 : 0) + norm() * 4).toFixed(1);
    out.push({ nome, uf: UFS[Math.floor(r() * UFS.length)], porte, populacao, acidentes, pctJovens, pctIdosos, frota, mortalidade });
  }
  // Separate deterministic stream: existing municipal indicators remain unchanged.
  const infraRandom = mulberry32(seed ^ 0x9e3779b9);
  return out.map((d) => {
    const escala = d.populacao / 100000;
    const densidade = d.porte === "grande" ? 1.3 : d.porte === "médio" ? 1 : 0.65;
    return {
      ...d,
      fotossensores: Math.max(0, Math.round(escala * (1.2 + infraRandom() * 3.8) * densidade + (infraRandom() < 0.2 ? 1 : 0))),
      semaforos: Math.max(0, Math.round(escala * (6 + infraRandom() * 18) * densidade)),
      faixasPedestres: Math.max(0, Math.round(escala * (60 + infraRandom() * 150))),
      kmCalcadas: +(escala * (70 + infraRandom() * 180)).toFixed(1),
      motofaixas: +(escala * (d.porte === "pequeno" ? infraRandom() * 0.8 : 1 + infraRandom() * 5)).toFixed(1),
      multasAplicadas: Math.max(0, Math.round(escala * (2000 + infraRandom() * 9000) * (d.frota / d.populacao))),
    };
  });
}

export const COLUNAS = ["nome", "uf", "porte", "populacao", "acidentes", "pctJovens", "pctIdosos", "frota", "mortalidade"] as const;

export function parseCSV(text: string): Municipio[] {
  const lines = text.trim().split(/\r?\n/);
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.trim());
  const missing = COLUNAS.filter((c) => c !== "populacao" && !head.includes(c));
  if (missing.length) throw new Error(`Colunas ausentes: ${missing.join(", ")}`);
  return lines.slice(1).filter(Boolean).map((l) => {
    const v = l.split(sep);
    const g = (k: string) => (v[head.indexOf(k)] ?? "").trim();
    const n = (k: string) => Number(g(k).replace(",", "."));
    const frota = n("frota");
    return {
      nome: g("nome"), uf: g("uf"), porte: (g("porte") || "médio") as Porte,
      populacao: head.includes("populacao") ? n("populacao") : Math.round(frota / 0.45),
      acidentes: n("acidentes"), pctJovens: n("pctJovens"), pctIdosos: n("pctIdosos"),
      frota, mortalidade: n("mortalidade"),
    };
  });
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function download(name: string, content: string, type = "text/csv") {
  const blob = new Blob(["\ufeff" + content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const VARS = [
  { key: "acidentes", label: "Acidentes" },
  { key: "pctJovens", label: "% Jovens (18–24)" },
  { key: "pctIdosos", label: "% Idosos (60+)" },
  { key: "frota", label: "Frota" },
  { key: "mortalidade", label: "Mortalidade /100mil" },
] as const;
export type VarKey = (typeof VARS)[number]["key"];
