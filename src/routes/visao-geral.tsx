import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComoCalculado, PageHeader, fmt } from "@/components/AppShell";
import { useSad } from "@/lib/sad";
import { VARS } from "@/lib/data";
import { histogram, mean, median, sd } from "@/lib/stats";

export const Route = createFileRoute("/visao-geral")({
  head: () => ({
    meta: [
      { title: "Panorama do estado — ViaSegura SAD" },
      { name: "description", content: "Estatísticas descritivas e histogramas dos indicadores viários municipais." },
      { property: "og:title", content: "Panorama do estado — ViaSegura SAD" },
      { property: "og:description", content: "Média, mediana, desvio padrão e CV das variáveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisaoGeral,
});

function VisaoGeral() {
  const { dados } = useSad();
  return (
    <>
      <PageHeader title="Como está o estado hoje?" desc={`Como os ${dados.length} municípios se distribuem em acidentes, idade dos condutores, frota e mortalidade.`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {VARS.map((v) => (
          <Card key={v.key}>
            <CardHeader className="pb-0"><CardTitle className="text-sm">{v.label}</CardTitle></CardHeader>
            <CardContent className="h-52 pt-2">
              <ResponsiveContainer>
                <BarChart data={histogram(dados.map((d) => d[v.key]), 10)}>
                  <XAxis dataKey="faixa" fontSize={10} />
                  <YAxis fontSize={10} width={28} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="contagem" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
      <ComoCalculado tecnica="Sumarização (estatística descritiva)" resumo="Para cada indicador calculamos média, mediana, desvio padrão e coeficiente de variação (CV = desvio padrão ÷ média). Os gráficos acima são histogramas: mostram quantos municípios caem em cada faixa de valor.">
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Variável</th><th className="p-3 text-right">Média</th><th className="p-3 text-right">Mediana</th><th className="p-3 text-right">Desvio padrão</th><th className="p-3 text-right">CV</th><th className="p-3 text-right">Mín</th><th className="p-3 text-right">Máx</th></tr>
            </thead>
            <tbody>
              {VARS.map((v) => {
                const x = dados.map((d) => d[v.key]);
                const m = mean(x), s = sd(x);
                return (
                  <tr key={v.key} className="border-t">
                    <td className="p-3 font-medium">{v.label}</td>
                    <td className="num p-3 text-right">{fmt(m, 1)}</td>
                    <td className="num p-3 text-right">{fmt(median(x), 1)}</td>
                    <td className="num p-3 text-right">{fmt(s, 1)}</td>
                    <td className="num p-3 text-right">{fmt((s / m) * 100, 1)}%</td>
                    <td className="num p-3 text-right">{fmt(Math.min(...x), 1)}</td>
                    <td className="num p-3 text-right">{fmt(Math.max(...x), 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </ComoCalculado>
    </>
  );
}
