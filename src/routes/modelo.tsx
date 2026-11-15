import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CircleAlert, Minus, RotateCcw, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComoCalculado, PageHeader, brl, fmt } from "@/components/AppShell";
import { useSad } from "@/lib/sad";
import {
  ALAVANCAS,
  calcularCenario,
  deltasZerados,
  limiteSlider,
  parametrosIniciais,
  por100mil,
  sugerirAcoes,
  valorAlavanca,
  type AlavancaKey,
  type Parametros,
} from "@/lib/simulador";
import type { Municipio } from "@/lib/data";
import { mean } from "@/lib/stats";

export const Route = createFileRoute("/modelo")({
  head: () => ({
    meta: [
      { title: "ViaSeguraSAD" },
      { name: "description", content: "Compare investimentos em segurança viária e simule seus efeitos em cada município." },
      { property: "og:title", content: "ViaSeguraSAD — Simulador de cenários" },
      { property: "og:description", content: "Alavancas de mobilidade, comparação com municípios parecidos e sugestões por custo-benefício." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Modelo,
});

function Modelo() {
  const { dados, labels, clusters } = useSad();
  const [indice, setIndice] = useState(0);
  const [deltas, setDeltas] = useState(deltasZerados);
  const [parametros, setParametros] = useState<Parametros>(parametrosIniciais);
  const [orcamento, setOrcamento] = useState(1000000);
  const municipio = dados[Math.min(indice, dados.length - 1)];
  const indiceAtual = dados.indexOf(municipio);
  const grupo = useMemo(
    () => dados.filter((_, i) => labels[i] === labels[indiceAtual]),
    [dados, labels, indiceAtual],
  );
  const perfil = clusters[labels[indiceAtual]];
  const cenario = calcularCenario(municipio, deltas, parametros);
  const sugestoes = sugerirAcoes(municipio, grupo, parametros, orcamento);

  const escolherMunicipio = (valor: string) => {
    setIndice(Number(valor));
    setDeltas(deltasZerados());
  };
  const mudarParametro = (key: AlavancaKey, campo: "acidentes" | "mortalidade" | "custo", valor: number) => {
    setParametros((atual) => ({ ...atual, [key]: { ...atual[key], [campo]: Number.isFinite(valor) ? valor : 0 } }));
  };

  return (
    <>
      <PageHeader
        title="Onde seu investimento pode salvar mais vidas?"
        desc="Escolha um município, teste ações de segurança viária e compare o custo com a redução esperada de acidentes e mortes."
      />

      <Card className="mb-6 border-primary/30">
        <CardContent className="p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_2fr] lg:items-end">
            <div>
              <label htmlFor="municipio-simulador" className="mb-2 block text-sm font-medium">Município em análise</label>
              <Select value={String(indiceAtual)} onValueChange={escolherMunicipio}>
                <SelectTrigger id="municipio-simulador" className="h-11 bg-card text-base">
                  <SelectValue placeholder="Selecione o município" />
                </SelectTrigger>
                <SelectContent>
                  {dados.map((d, i) => <SelectItem key={`${d.nome}-${d.uf}-${i}`} value={String(i)}>{d.nome} — {d.uf}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">Perfil {perfil.nome} · {grupo.length} municípios parecidos</p>
            </div>
            <Contexto municipio={municipio} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Teste as alavancas de mobilidade</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Use os controles para adicionar ou retirar unidades. O cenário é atualizado na hora.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDeltas(deltasZerados())}>
              <RotateCcw className="h-4 w-4" /> Limpar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {ALAVANCAS.map((a) => {
              const atual = valorAlavanca(municipio, a.key);
              const limite = limiteSlider(municipio, a.key);
              const minimo = -Math.min(atual, limite);
              const delta = deltas[a.key];
              return (
                <div key={a.key} className="border-b pb-5 last:border-b-0 last:pb-0">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{a.label}</div>
                      <div className="text-xs text-muted-foreground">Hoje: {fmt(atual, a.passo < 1 ? 1 : 0)} {a.unidade}</div>
                    </div>
                    <div className="text-right">
                      <div className={`num text-sm font-semibold ${delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : ""}`}>
                        {delta > 0 ? "+" : ""}{fmt(delta, a.passo < 1 ? 1 : 0)} {a.unidade}
                      </div>
                      <div className="text-xs text-muted-foreground">Cenário: {fmt(Math.max(0, atual + delta), a.passo < 1 ? 1 : 0)}</div>
                    </div>
                  </div>
                  <Slider
                    aria-label={`Variação de ${a.label}`}
                    min={minimo}
                    max={limite}
                    step={a.passo}
                    value={[delta]}
                    onValueChange={([valor]) => setDeltas((atuais) => ({ ...atuais, [a.key]: valor }))}
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{fmt(minimo, a.passo < 1 ? 1 : 0)}</span><span>+{fmt(limite, a.passo < 1 ? 1 : 0)}</span></div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="h-fit border-primary/30 bg-accent/40 xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="text-base">Resultado esperado em 12 meses</CardTitle>
            <p className="text-xs text-muted-foreground">Projeção para {municipio.nome}, conforme os efeitos assumidos abaixo.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Resultado
              titulo="Acidentes esperados"
              valor={fmt(cenario.acidentes)}
              sufixo="acidentes"
              atual={`Hoje: ${fmt(municipio.acidentes)}`}
              delta={cenario.deltaAcidentes}
            />
            <Resultado
              titulo="Mortalidade esperada"
              valor={fmt(cenario.mortalidade, 1)}
              sufixo="mortes por 100 mil hab."
              atual={`Hoje: ${fmt(municipio.mortalidade, 1)} por 100 mil hab.`}
              delta={cenario.deltaMortalidade}
              casas={1}
            />
            <div className="rounded-md bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><WalletCards className="h-4 w-4" /> Investimento do cenário</div>
              <div className="num mt-1 text-xl font-semibold">{brl(cenario.investimento)}</div>
              <div className={`mt-1 text-xs ${cenario.investimento > orcamento ? "text-destructive" : "text-muted-foreground"}`}>
                {cenario.investimento > orcamento
                  ? `${brl(cenario.investimento - orcamento)} acima do orçamento informado`
                  : `${brl(Math.max(0, orcamento - cenario.investimento))} disponíveis no orçamento`}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Estimativas para comparação de cenários, não previsão garantida. Aplicações de multas têm custo operacional por unidade.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">O município está melhor ou pior que seus parecidos?</CardTitle>
          <p className="text-sm text-muted-foreground">Comparação com a média do perfil “{perfil.nome}”, sempre por 100 mil habitantes.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr><th className="p-3 pl-6">Indicador por 100 mil hab.</th><th className="p-3 text-right">{municipio.nome}</th><th className="p-3 text-right">Média do grupo</th><th className="p-3 pr-6 text-right">Leitura</th></tr>
            </thead>
            <tbody>
              {ALAVANCAS.map((a) => {
                const taxa = por100mil(valorAlavanca(municipio, a.key), municipio.populacao);
                const taxaGrupo = mean(grupo.map((g) => por100mil(valorAlavanca(g, a.key), g.populacao)));
                return <LinhaComparacao key={a.key} nome={a.label} valor={taxa} grupo={taxaGrupo} menorEPior casas={a.passo < 1 ? 1 : 0} />;
              })}
              <LinhaComparacao nome="Acidentes" valor={por100mil(municipio.acidentes, municipio.populacao)} grupo={mean(grupo.map((g) => por100mil(g.acidentes, g.populacao)))} />
              <LinhaComparacao nome="Mortalidade" valor={municipio.mortalidade} grupo={mean(grupo.map((g) => g.mortalidade))} casas={1} />
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orçamento, custos e efeitos</CardTitle>
            <p className="text-sm text-muted-foreground">Ajuste as premissas para a realidade do estado. Efeitos negativos representam redução por unidade adicionada.</p>
          </CardHeader>
          <CardContent>
            <label className="text-sm font-medium" htmlFor="orcamento-simulador">Orçamento disponível (R$)</label>
            <Input id="orcamento-simulador" type="number" min={0} step={50000} value={orcamento} onChange={(e) => setOrcamento(Math.max(0, Number(e.target.value)))} className="num mb-6 mt-2" />
            <div className="mb-3 grid grid-cols-[1fr_74px_74px_105px] gap-2 text-[11px] font-medium text-muted-foreground">
              <span>Alavanca</span><span className="text-right">Acidentes</span><span className="text-right">Mortalidade</span><span className="text-right">Custo unitário</span>
            </div>
            <div className="space-y-3">
              {ALAVANCAS.map((a) => (
                <div key={a.key} className="grid grid-cols-[1fr_74px_74px_105px] items-center gap-2">
                  <div className="text-xs"><div className="font-medium">{a.label}</div><div className="text-muted-foreground">por {a.key === "multasAplicadas" ? "100 multas" : a.unidade === "km" ? "km" : "unidade"}</div></div>
                  <Input aria-label={`Efeito de ${a.label} nos acidentes`} type="number" step={0.01} value={parametros[a.key].acidentes} onChange={(e) => mudarParametro(a.key, "acidentes", Number(e.target.value))} className="num h-8 px-1.5 text-right text-xs" />
                  <Input aria-label={`Efeito de ${a.label} na mortalidade`} type="number" step={0.01} value={parametros[a.key].mortalidade} onChange={(e) => mudarParametro(a.key, "mortalidade", Number(e.target.value))} className="num h-8 px-1.5 text-right text-xs" />
                  <Input aria-label={`Custo unitário de ${a.label}`} type="number" min={0} step={1000} value={parametros[a.key].custo} onChange={(e) => mudarParametro(a.key, "custo", Math.max(0, Number(e.target.value)))} className="num h-8 px-1.5 text-right text-xs" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium">Efeito assumido com base na literatura (% por unidade)</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">São premissas iniciais editáveis, não efeitos causais medidos neste município. Para multas, cada unidade corresponde a 100 autuações.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Três caminhos com melhor retorno esperado</CardTitle>
            <p className="text-sm text-muted-foreground">Prioridade pelo número de mortes evitadas para cada R$ 1 milhão investido.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sugestoes.map((s, i) => {
              const alavanca = ALAVANCAS.find((a) => a.key === s.key)!;
              return (
                <div key={s.key} className="rounded-lg border bg-accent/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                      <div>
                        <h3 className="text-sm font-semibold">{tituloAcao(s.key, s.quantidade)}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{brl(s.custo)} · {fmt(s.porMilhao, 2)} mortes evitadas por R$ 1 mi</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">
                    {s.abaixoDoGrupo
                      ? `Municípios parecidos têm, em média, ${fmt(s.taxaGrupo, 1)} por 100 mil hab.; aqui são ${fmt(s.taxaAtual, 1)}. `
                      : `O município já está próximo ou acima da média dos parecidos; este pacote ainda pode trazer ganhos. `}
                    A instalação reduziria cerca de <strong>{fmt(s.acidentesEvitados)} acidentes</strong> e <strong>{fmt(s.mortesEvitadas, 2)} morte por ano</strong>, pelo efeito assumido.
                  </p>
                </div>
              );
            })}
            {sugestoes.length === 0 && <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">O orçamento informado não cobre nenhuma unidade. Aumente o valor ou revise os custos.</p>}
            <p className="text-xs text-muted-foreground">Cada caminho é avaliado separadamente dentro do orçamento total; não some os três benefícios.</p>
          </CardContent>
        </Card>
      </div>

      <ComoCalculado
        tecnica="Simulação por efeitos unitários e comparação com o grupo"
        resumo="O cenário parte dos acidentes e da mortalidade atuais do município. Cada unidade adicionada aplica o percentual editável de redução ou aumento, de forma linear e aditiva. Os resultados ficam entre zero e o dobro do valor atual. A comparação usa a média dos municípios do mesmo grupo do K-means e taxas por 100 mil habitantes. As sugestões buscam primeiro fechar a diferença para a média do grupo e ordenam as ações por mortes evitadas por R$ 1 milhão, sem ultrapassar o orçamento."
      >
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-md bg-muted p-3"><strong className="text-foreground">Cenário:</strong> resultado atual × [1 + Σ(variação × efeito ÷ 100)].</div>
          <div className="rounded-md bg-muted p-3"><strong className="text-foreground">Retorno:</strong> mortes evitadas ÷ custo da ação × R$ 1 milhão.</div>
          <div className="rounded-md bg-muted p-3"><strong className="text-foreground">Limite:</strong> os efeitos são premissas inspiradas na literatura, não relações causais estimadas com os dados simulados.</div>
        </div>
      </ComoCalculado>
    </>
  );
}

function tituloAcao(key: AlavancaKey, quantidade: number) {
  const casas = key === "kmCalcadas" || key === "motofaixas" ? 1 : 0;
  const valor = fmt(quantidade, casas);
  if (key === "multasAplicadas") return `Aplicar ${valor} multas`;
  if (key === "faixasPedestres") return `Adicionar ${valor} faixas de pedestres`;
  if (key === "kmCalcadas") return `Adicionar ${valor} km de calçadas`;
  if (key === "motofaixas") return `Adicionar ${valor} km de motofaixas`;
  return `Adicionar ${valor} ${key === "fotossensores" ? "fotossensores (radares)" : "semáforos"}`;
}

function Contexto({ municipio }: { municipio: Municipio }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">Contexto do município (não controlável)</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-muted-foreground">População</div><div className="num mt-1 text-sm font-semibold">{fmt(municipio.populacao)}</div></div>
        <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-muted-foreground">Frota</div><div className="num mt-1 text-sm font-semibold">{fmt(municipio.frota)}</div></div>
        <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-muted-foreground">Jovens (18–24)</div><div className="num mt-1 text-sm font-semibold">{fmt(municipio.pctJovens, 1)}%</div></div>
        <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-muted-foreground">Idosos (60+)</div><div className="num mt-1 text-sm font-semibold">{fmt(municipio.pctIdosos, 1)}%</div></div>
      </div>
    </div>
  );
}

function Resultado({ titulo, valor, sufixo, atual, delta, casas = 0 }: { titulo: string; valor: string; sufixo: string; atual: string; delta: number; casas?: number }) {
  return (
    <div className="border-b pb-5 last:border-b-0">
      <div className="text-xs text-muted-foreground">{titulo}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2"><span className="num text-3xl font-semibold">{valor}</span><span className="text-xs text-muted-foreground">{sufixo}</span></div>
      <div className="mt-1 text-xs text-muted-foreground">{atual}</div>
      <div className={`mt-2 flex items-center gap-1 text-sm font-semibold ${delta < 0 ? "text-success" : delta > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {delta < 0 ? <ArrowDown className="h-4 w-4" /> : delta > 0 ? <ArrowUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        {delta > 0 ? "+" : ""}{fmt(delta, casas)} no cenário
      </div>
    </div>
  );
}

function LinhaComparacao({ nome, valor, grupo, menorEPior = false, casas = 0 }: { nome: string; valor: number; grupo: number; menorEPior?: boolean; casas?: number }) {
  const diferenca = valor - grupo;
  const pior = menorEPior ? diferenca < 0 : diferenca > 0;
  const neutro = Math.abs(diferenca) < 0.0001;
  return (
    <tr className={`border-t ${pior ? "bg-destructive/5" : ""}`}>
      <td className="p-3 pl-6 font-medium">{nome}</td>
      <td className="num p-3 text-right">{fmt(valor, casas)}</td>
      <td className="num p-3 text-right text-muted-foreground">{fmt(grupo, casas)}</td>
      <td className={`p-3 pr-6 text-right text-xs ${pior ? "font-semibold text-destructive" : "text-success"}`}>
        <span className="inline-flex items-center gap-1">{pior && <CircleAlert className="h-3.5 w-3.5" />}{neutro ? "Na média" : pior ? menorEPior ? "Abaixo do grupo" : "Pior que o grupo" : "Melhor que o grupo"}</span>
      </td>
    </tr>
  );
}
