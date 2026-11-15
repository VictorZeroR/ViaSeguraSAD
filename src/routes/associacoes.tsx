import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ComoCalculado, PageHeader } from "@/components/AppShell";
import { useSad } from "@/lib/sad";
import { VARS } from "@/lib/data";
import { pearson } from "@/lib/stats";

export const Route = createFileRoute("/associacoes")({
  head: () => ({
    meta: [
      { title: "ViaSeguraSAD" },
      { name: "description", content: "Matriz de correlação de Pearson com p-valores e significância a 5%." },
      { property: "og:title", content: "ViaSeguraSAD — O que pesa nos acidentes" },
      { property: "og:description", content: "Heatmap de correlações entre indicadores viários." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Associacoes,
});

function cellColor(r: number) {
  const a = Math.round(Math.abs(r) * 85);
  return r >= 0 ? `color-mix(in oklab, var(--chart-1) ${a}%, var(--card))` : `color-mix(in oklab, var(--destructive) ${a}%, var(--card))`;
}

function Associacoes() {
  const { dados } = useSad();
  const cols = VARS.map((v) => dados.map((d) => d[v.key]));
  return (
    <>
      <PageHeader title="O que mais pesa nos acidentes?" desc="Quais características dos municípios andam junto com o número de acidentes — e quanto." />
      <Card className="mb-2">
        <CardContent className="space-y-4 p-5">
          {VARS.filter((v) => v.key !== "acidentes").map((v) => {
            const { r, p } = pearson(dados.map((d) => d[v.key]), dados.map((d) => d.acidentes));
            const forca = Math.abs(r) >= 0.6 ? "Pesa muito" : Math.abs(r) >= 0.3 ? "Pesa moderadamente" : "Pesa pouco";
            return (
              <div key={v.key}>
                <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-medium">{v.label}</span>
                  <span className="text-muted-foreground">{forca}{p < 0.05 ? "" : " (relação incerta)"} · {r >= 0 ? "quanto maior, mais acidentes" : "quanto maior, menos acidentes"}</span>
                </div>
                <div className="h-2 rounded bg-muted"><div className="h-full rounded" style={{ width: `${Math.abs(r) * 100}%`, background: r >= 0 ? "var(--chart-1)" : "var(--destructive)" }} /></div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <ComoCalculado tecnica="Correlação de Pearson" resumo="O coeficiente r vai de −1 a 1 e mede quanto dois indicadores sobem ou descem juntos. O valor-p (teste t, gl = n − 2) indica se a relação pode ser acaso; abaixo de 0,05 consideramos a relação confiável. Atenção: relação não prova causa.">
      <Card>
        <CardContent className="overflow-x-auto p-4">
          <table className="mx-auto border-separate border-spacing-1 text-sm">
            <thead><tr><th />{VARS.map((v) => <th key={v.key} className="w-28 p-2 text-xs font-medium text-muted-foreground">{v.label}</th>)}</tr></thead>
            <tbody>
              {VARS.map((a, i) => (
                <tr key={a.key}>
                  <th className="pr-2 text-right text-xs font-medium text-muted-foreground">{a.label}</th>
                  {VARS.map((b, j) => {
                    const { r, p } = pearson(cols[i], cols[j]);
                    const sig = i !== j && p < 0.05;
                    return (
                      <td key={b.key} className={`h-20 rounded-md text-center ${sig ? "ring-2 ring-foreground" : ""}`} style={{ background: cellColor(r) }}>
                        <div className={`num text-base font-semibold ${Math.abs(r) > 0.6 ? "text-primary-foreground" : ""}`}>{r.toFixed(2)}{sig && "*"}</div>
                        {i !== j && <div className={`num text-[10px] ${Math.abs(r) > 0.6 ? "text-primary-foreground" : "text-muted-foreground"}`}>p = {p < 0.001 ? "<0,001" : p.toFixed(3)}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-center text-xs text-muted-foreground">Azul = correlação positiva · Vermelho = negativa · intensidade ∝ |r|</p>
        </CardContent>
      </Card>
      </ComoCalculado>
    </>
  );
}
