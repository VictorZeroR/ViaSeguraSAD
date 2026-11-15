import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComoCalculado, PageHeader, fmt } from "@/components/AppShell";
import { CLUSTER_VARS, useSad } from "@/lib/sad";
import { kmeans, mean, mulberry32, ols, silhouette, zscore } from "@/lib/stats";

export const Route = createFileRoute("/validacao")({
  head: () => ({
    meta: [
      { title: "ViaSeguraSAD" },
      { name: "description", content: "Validação treino/teste da regressão e silhueta do K-means." },
      { property: "og:title", content: "ViaSeguraSAD — Confiabilidade do sistema" },
      { property: "og:description", content: "R² e MAE fora da amostra e qualidade dos clusters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Validacao,
});

function Validacao() {
  const { dados, labels, k } = useSad();
  const [seed, setSeed] = useState(42);

  const reg = useMemo(() => {
    const r = mulberry32(seed);
    const idx = dados.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const cut = Math.round(idx.length * 0.8);
    const tr = idx.slice(0, cut).map((i) => dados[i]), te = idx.slice(cut).map((i) => dados[i]);
    const m = ols(tr.map((d) => [d.pctJovens, d.pctIdosos, d.frota]), tr.map((d) => d.acidentes), ["J", "I", "F"]);
    const evalSet = (s: typeof dados) => {
      const y = s.map((d) => d.acidentes), yh = s.map((d) => m.predict([d.pctJovens, d.pctIdosos, d.frota]));
      const my = mean(y);
      const sse = y.reduce((a, v, i) => a + (v - yh[i]) ** 2, 0), sst = y.reduce((a, v) => a + (v - my) ** 2, 0);
      return { r2: 1 - sse / sst, mae: mean(y.map((v, i) => Math.abs(v - yh[i]))), n: s.length };
    };
    return { treino: evalSet(tr), teste: evalSet(te) };
  }, [dados, seed]);

  const sil = useMemo(() => {
    const rows = zscore(CLUSTER_VARS.map((v) => dados.map((d) => d[v])));
    return [2, 3, 4, 5, 6].map((kk) => ({ k: `K=${kk}`, silhueta: +(kk === k ? silhouette(rows, labels) : silhouette(rows, kmeans(rows, kk).labels)).toFixed(3) }));
  }, [dados, labels, k]);
  const atual = sil.find((s) => s.k === `K=${k}`)!.silhueta;

  return (
    <>
      <PageHeader title="Quanto posso confiar nestes resultados?" desc="Testamos o sistema com municípios que ele não usou para aprender, e conferimos se os perfis fazem sentido.">
        <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}><RefreshCw className="mr-1 h-4 w-4" />Testar de novo</Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Previsão de acidentes</div>
          <div className="mt-1 text-lg font-semibold">{reg.teste.r2 >= 0.7 && Math.abs(reg.treino.r2 - reg.teste.r2) < 0.1 ? "Confiável" : reg.teste.r2 >= 0.4 ? "Razoável — use com cautela" : "Fraca — use só como referência"}</div>
          <p className="mt-1 text-sm text-muted-foreground">Em municípios que o sistema não viu, a previsão erra em média {fmt(reg.teste.mae, 0)} acidentes por município.</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Separação dos perfis de municípios</div>
          <div className="mt-1 text-lg font-semibold">{atual > 0.5 ? "Grupos bem definidos" : atual >= 0.25 ? "Grupos razoavelmente definidos" : "Grupos pouco nítidos"}</div>
          <p className="mt-1 text-sm text-muted-foreground">Com {k} grupos, os municípios de cada perfil {atual >= 0.25 ? "são de fato parecidos entre si" : "se misturam bastante com os de outros perfis"}.</p>
        </CardContent></Card>
      </div>
      <ComoCalculado tecnica="Validação treino/teste e silhueta" resumo="A regressão é ajustada com 80% dos municípios (treino) e avaliada nos 20% restantes (teste), comparando R² e erro médio absoluto (MAE). A silhueta mede, de −1 a 1, o quanto cada município está mais perto do seu grupo do que dos outros: acima de 0,5 estrutura forte, 0,25–0,5 razoável, abaixo de 0,25 fraca.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Regressão — treino vs. teste</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">Conjunto</th><th className="p-3 text-right">n</th><th className="p-3 text-right">R²</th><th className="p-3 text-right">MAE (acidentes)</th></tr></thead>
              <tbody>
                {(["treino", "teste"] as const).map((s) => (
                  <tr key={s} className="border-t">
                    <td className="p-3 font-medium capitalize">{s}</td>
                    <td className="num p-3 text-right">{reg[s].n}</td>
                    <td className="num p-3 text-right">{reg[s].r2.toFixed(3)}</td>
                    <td className="num p-3 text-right">{fmt(reg[s].mae, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="p-3 text-xs text-muted-foreground">
              {Math.abs(reg.treino.r2 - reg.teste.r2) < 0.1 ? "R² estável entre treino e teste: sem sinal relevante de sobreajuste." : "Diferença notável entre treino e teste: interprete o modelo com cautela."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle className="text-sm">Silhueta média por K (atual: K={k} → {atual.toFixed(3)})</CardTitle></CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer>
              <BarChart data={sil}>
                <XAxis dataKey="k" fontSize={11} />
                <YAxis fontSize={11} width={36} domain={[0, "auto"]} />
                <Tooltip />
                <Bar dataKey="silhueta" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      </ComoCalculado>
    </>
  );
}
