import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CHART_COLORS, ComoCalculado, PageHeader, fmt } from "@/components/AppShell";
import { CLUSTER_VARS, useSad } from "@/lib/sad";
import { VARS } from "@/lib/data";
import { kmeans, zscore } from "@/lib/stats";

export const Route = createFileRoute("/perfis")({
  head: () => ({
    meta: [
      { title: "ViaSeguraSAD" },
      { name: "description", content: "Agrupamento K-means dos municípios com gráfico do cotovelo e perfis médios." },
      { property: "og:title", content: "ViaSeguraSAD — Perfis de municípios" },
      { property: "og:description", content: "Clusters de risco viário com K ajustável." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Perfis,
});

function Perfis() {
  const { dados, k, setK, labels, clusters } = useSad();
  const cotovelo = useMemo(() => {
    const rows = zscore(CLUSTER_VARS.map((v) => dados.map((d) => d[v])));
    return Array.from({ length: 8 }, (_, i) => ({ k: i + 1, wss: +kmeans(rows, i + 1).wss.toFixed(1) }));
  }, [dados]);

  return (
    <>
      <PageHeader title="Municípios parecidos pedem ações parecidas" desc="Agrupamos os municípios com problemas semelhantes, para que cada grupo receba o tipo de ação mais adequado." />
      <div className="mb-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Quantos grupos formar</CardTitle></CardHeader>
          <CardContent>
            <div className="num mb-3 text-4xl font-semibold text-primary">{k} grupos</div>
            <Slider min={2} max={6} step={1} value={[k]} onValueChange={([v]) => setK(v)} />
            <p className="mt-3 text-xs text-muted-foreground">Mais grupos separam perfis com mais detalhe; o padrão (4) costuma ser um bom equilíbrio.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle className="text-sm">% de jovens × acidentes, por grupo</CardTitle></CardHeader>
          <CardContent className="h-56 pt-2">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" name="% Jovens" fontSize={11} type="number" domain={["auto", "auto"]} />
                <YAxis dataKey="y" name="Acidentes" fontSize={11} width={40} />
                <ZAxis range={[25, 25]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {clusters.map((c) => (
                  <Scatter key={c.id} name={`C${c.id + 1}`} fill={CHART_COLORS[c.id]} data={dados.filter((_, i) => labels[i] === c.id).map((d) => ({ x: d.pctJovens, y: d.acidentes }))} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clusters.map((c) => (
          <Card key={c.id} className="border-t-4" style={{ borderTopColor: CHART_COLORS[c.id] }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">C{c.id + 1} · {c.nome}</CardTitle>
                <Badge variant={c.tipo === "alto" ? "destructive" : "secondary"}>{c.n} mun.</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                {VARS.map((v) => (
                  <div key={v.key} className="flex justify-between"><dt className="text-muted-foreground">{v.label}</dt><dd className="num">{fmt(c.perfil[v.key], 1)}</dd></div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
      <ComoCalculado tecnica="K-means" resumo="Os municípios são agrupados pela semelhança em acidentes, % de jovens, % de idosos, frota e mortalidade (valores padronizados, inicialização k-means++ com 8 reinícios). O gráfico do cotovelo ajuda a escolher o número de grupos: o ponto em que a curva para de cair rapidamente.">
        <Card className="max-w-xl">
          <CardHeader className="pb-0"><CardTitle className="text-sm">Gráfico do cotovelo (WSS)</CardTitle></CardHeader>
          <CardContent className="h-56 pt-2">
            <ResponsiveContainer>
              <LineChart data={cotovelo}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="k" fontSize={11} />
                <YAxis fontSize={11} width={40} />
                <Tooltip />
                <Line dataKey="wss" stroke="var(--chart-1)" strokeWidth={2} dot={(p: { cx: number; cy: number; payload: { k: number } }) => <circle key={p.payload.k} cx={p.cx} cy={p.cy} r={p.payload.k === k ? 6 : 3} fill="var(--chart-1)" />} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </ComoCalculado>
    </>
  );
}
