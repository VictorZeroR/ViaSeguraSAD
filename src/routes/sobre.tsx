import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Database, FlaskConical, Scale, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ComoCalculado, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Metodologia — ViaSegura SAD" },
      { name: "description", content: "Fluxo de dados do sistema: dados, análises, modelo de decisão e recomendação." },
      { property: "og:title", content: "Metodologia — ViaSegura SAD" },
      { property: "og:description", content: "Como o ViaSegura SAD transforma dados em recomendações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sobre,
});

const ETAPAS = [
  { icon: Database, t: "Dados", d: "100 municípios (2022): acidentes, % jovens, % idosos, frota, mortalidade. Base simulada ou CSV importado." },
  { icon: FlaskConical, t: "Análises", d: "Estatística descritiva, correlação de Pearson, K-means e regressão linear múltipla." },
  { icon: Scale, t: "Modelo de decisão", d: "Índice de risco ponderado + regras por cluster + restrição orçamentária." },
  { icon: Lightbulb, t: "Recomendação", d: "Ranking priorizado com ação, custo e justificativa, exportável em CSV/PDF." },
];

function Sobre() {
  return (
    <>
      <PageHeader title="Como o sistema chega às recomendações" desc="Dos dados dos municípios até a lista de onde agir primeiro, com qual ação e a que custo, dentro do orçamento disponível." />
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {ETAPAS.map((e, i) => (
          <div key={e.t} className="flex flex-1 flex-col items-center gap-3 lg:flex-row">
            <Card className="w-full flex-1">
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><e.icon className="h-5 w-5" /></div>
                <div className="text-xs text-muted-foreground">Etapa {i + 1}</div>
                <div className="font-semibold">{e.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{e.d}</p>
              </CardContent>
            </Card>
            {i < ETAPAS.length - 1 && <ArrowRight className="h-6 w-6 shrink-0 rotate-90 text-primary lg:rotate-0" />}
          </div>
        ))}
      </div>
      <Card className="mt-8">
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Regras de decisão.</strong> Cluster de alto risco com índice acima do limiar → Fiscalização intensiva + educação para jovens. Cluster envelhecido → Campanha de renovação de CNH e exames de visão. Risco médio → Monitoramento. Os municípios são financiados em ordem decrescente de índice até esgotar o orçamento.</p>
          <p><strong className="text-foreground">Importação.</strong> CSV com colunas: nome, uf, porte, acidentes, pctJovens, pctIdosos, frota, mortalidade (populacao opcional). Separador vírgula ou ponto e vírgula.</p>
          <p><strong className="text-foreground">Fontes de inspiração.</strong> RENAEST (acidentes), RENACH (condutores) e IBGE (população e frota). Os dados exibidos por padrão são fictícios.</p>
        </CardContent>
      </Card>
      <ComoCalculado tecnica="Sumarização, K-means, correlação de Pearson, regressão linear, validação treino/teste e silhueta" resumo="Resumo das técnicas usadas em cada tela.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li><strong className="text-foreground">Sumarização:</strong> média, mediana, desvio padrão e CV de cada indicador (Panorama do estado).</li>
          <li><strong className="text-foreground">K-means:</strong> agrupa municípios semelhantes em perfis (Perfis de municípios).</li>
          <li><strong className="text-foreground">Correlação de Pearson:</strong> mede quanto cada indicador anda junto com os acidentes (O que pesa nos acidentes).</li>
          <li><strong className="text-foreground">Regressão linear múltipla:</strong> prevê acidentes a partir de % jovens, % idosos e frota (Simulador de cenários).</li>
          <li><strong className="text-foreground">Validação treino/teste e silhueta:</strong> conferem a qualidade da previsão e dos perfis (Confiabilidade do sistema).</li>
        </ul>
      </ComoCalculado>
    </>
  );
}
