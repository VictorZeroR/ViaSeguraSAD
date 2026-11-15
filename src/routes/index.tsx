import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComoCalculado, PageHeader, brl, fmt } from "@/components/AppShell";
import { decidir, useSad, type Pesos } from "@/lib/sad";
import { download, parseCSV, toCSV } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ViaSeguraSAD" },
      { name: "description", content: "Priorize municípios e ações de segurança viária dentro do orçamento disponível." },
      { property: "og:title", content: "ViaSeguraSAD — Onde agir primeiro" },
      { property: "og:description", content: "Ranking de municípios priorizados com ação recomendada e justificativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Decisao,
});

const PESOS: { key: keyof Pesos; label: string }[] = [
  { key: "acidentes", label: "Acidentes previstos" },
  { key: "mortalidade", label: "Mortalidade" },
  { key: "jovens", label: "% Jovens" },
  { key: "frota", label: "Frota" },
];

function Decisao() {
  const s = useSad();
  const fileRef = useRef<HTMLInputElement>(null);
  const rec = useMemo(
    () => decidir(s.dados, s.labels, s.clusters, s.modelo, s.pesos, s.custos, s.orcamento, s.limiar),
    [s.dados, s.labels, s.clusters, s.modelo, s.pesos, s.custos, s.orcamento, s.limiar],
  );
  const fin = rec.filter((r) => r.financiado);
  const gasto = fin.reduce((a, b) => a + b.custo, 0);

  const exportCSV = () =>
    download("viasegura-relatorio.csv", toCSV(fin.map((r) => ({ posicao: r.rank, municipio: r.nome, uf: r.uf, cluster: r.cluster, indice: r.indice.toFixed(3), acidentes_previstos: r.previstos, acao: r.acao, custo: r.custo, justificativa: r.justificativa }))));

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("ViaSegura SAD — Relatório de priorização", 14, 16);
    doc.setFontSize(10);
    doc.text(`Orçamento: ${brl(s.orcamento)} · Alocado: ${brl(gasto)} · Municípios atendidos: ${fin.length} · Limiar: ${s.limiar.toFixed(2)}`, 14, 23);
    autoTable(doc, {
      startY: 28,
      head: [["#", "Município", "UF", "Índice", "Ação", "Custo", "Justificativa"]],
      body: fin.map((r) => [r.rank, r.nome, r.uf, r.indice.toFixed(2), r.acao, brl(r.custo), r.justificativa]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [37, 84, 160] },
      columnStyles: { 6: { cellWidth: 100 } },
    });
    doc.save("viasegura-relatorio.pdf");
  };

  const onImport = async (f?: File) => {
    if (!f) return;
    try {
      const d = parseCSV(await f.text());
      if (d.length < 10) throw new Error("São necessários ao menos 10 municípios.");
      s.setDados(d);
      toast.success(`${d.length} municípios importados.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Onde agir primeiro?" desc="Os municípios que cabem no seu orçamento, em ordem de urgência, com a ação recomendada para cada um.">
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-4 w-4" />Importar CSV</Button>
          <Button variant="outline" size="sm" onClick={() => download("base-municipios.csv", toCSV(s.dados as never))}>Base atual</Button>
          <Button size="sm" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />CSV</Button>
          <Button size="sm" onClick={exportPDF}><FileText className="mr-1 h-4 w-4" />PDF</Button>
        </div>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Kpi label="Municípios atendidos" value={`${fin.length}`} />
        <Kpi label="Orçamento alocado" value={brl(gasto)} sub={`${fmt((gasto / s.orcamento) * 100, 1)}% de ${brl(s.orcamento)}`} />
        <Kpi label="Fiscalização intensiva" value={`${fin.filter((r) => r.acao.startsWith("Fiscal")).length}`} />
        <Kpi label="Campanhas CNH / Monitoramento" value={`${fin.filter((r) => r.acao.startsWith("Campanha")).length} / ${fin.filter((r) => r.acao === "Monitoramento").length}`} />
      </div>

        <Card className="min-w-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Municípios priorizados dentro do orçamento</CardTitle></CardHeader>
          <CardContent className="max-h-[900px] overflow-auto p-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                <tr><th className="p-2">#</th><th className="p-2">Município</th><th className="p-2">Urgência</th><th className="p-2">Ação recomendada</th><th className="p-2 text-right">Custo</th></tr>
              </thead>
              <tbody>
                {rec.filter((r) => r.custo > 0).map((r) => (
                  <tr key={r.nome} className={`border-t align-top ${r.financiado ? "" : "opacity-45"}`}>
                    <td className="num p-2">{r.rank}</td>
                    <td className="p-2">
                      <div className="font-medium">{r.nome} <span className="text-xs text-muted-foreground">· {r.uf} · {r.porte}</span></div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{r.justificativa}</div>
                    </td>
                    <td className="p-2">
                      <div className="num">{r.indice.toFixed(2)}</div>
                      <div className="mt-1 h-1.5 w-16 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${r.indice * 100}%` }} /></div>
                    </td>
                    <td className="p-2">
                      <Badge variant={r.acao.startsWith("Fiscal") ? "destructive" : r.acao.startsWith("Campanha") ? "default" : "secondary"} className="whitespace-normal text-left">{r.acao}</Badge>
                      {!r.financiado && <div className="mt-1 text-xs">Fora do orçamento</div>}
                    </td>
                    <td className="num p-2 text-right">{brl(r.custo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      <h2 className="mt-8 text-sm font-semibold">Ajuste os critérios da decisão</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pesos do índice de risco</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {PESOS.map((p) => (
                <div key={p.key}>
                  <div className="mb-1 flex justify-between text-xs"><span>{p.label}</span><span className="num">{s.pesos[p.key].toFixed(2)}</span></div>
                  <Slider min={0} max={1} step={0.05} value={[s.pesos[p.key]]} onValueChange={([v]) => s.setPesos({ ...s.pesos, [p.key]: v })} />
                </div>
              ))}
              <div>
                <div className="mb-1 flex justify-between text-xs"><span>Limiar de alto risco</span><span className="num">{s.limiar.toFixed(2)}</span></div>
                <Slider min={0.1} max={0.9} step={0.05} value={[s.limiar]} onValueChange={([v]) => s.setLimiar(v)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Orçamento e custos (R$)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Num label="Orçamento disponível" value={s.orcamento} onChange={s.setOrcamento} />
              <Num label="Fiscalização + educação" value={s.custos.fiscalizacao} onChange={(v) => s.setCustos({ ...s.custos, fiscalizacao: v })} />
              <Num label="Campanha CNH / visão" value={s.custos.campanha} onChange={(v) => s.setCustos({ ...s.custos, campanha: v })} />
              <Num label="Monitoramento" value={s.custos.monitoramento} onChange={(v) => s.setCustos({ ...s.custos, monitoramento: v })} />
            </CardContent>
          </Card>
        </div>

      <ComoCalculado tecnica="Índice de risco ponderado + regras por perfil" resumo="Cada município recebe uma nota de urgência de 0 a 1, que combina acidentes previstos (regressão linear), mortalidade, % de jovens e frota, conforme os pesos acima. A ação depende do perfil do município (K-means) e do limiar de alto risco; os municípios são atendidos em ordem de urgência até acabar o orçamento." />
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num mt-1 text-xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </CardContent></Card>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} step={10000} className="num h-8" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} />
    </div>
  );
}
