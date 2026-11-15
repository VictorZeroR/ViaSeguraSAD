import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, Boxes, GitBranch, LineChart, Target, CheckCircle2, Info, ShieldCheck } from "lucide-react";

const NAV = [
  { to: "/", label: "Onde agir primeiro", icon: Target },
  { to: "/visao-geral", label: "Panorama do estado", icon: BarChart3 },
  { to: "/perfis", label: "Perfis de municípios", icon: Boxes },
  { to: "/associacoes", label: "O que pesa nos acidentes", icon: GitBranch },
  { to: "/modelo", label: "Simulador de cenários", icon: LineChart },
  { to: "/validacao", label: "Confiabilidade do sistema", icon: CheckCircle2 },
  { to: "/sobre", label: "Metodologia", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
          <ShieldCheck className="h-6 w-6 text-sidebar-primary" />
          <div>
            <div className="font-semibold text-sidebar-accent-foreground">ViaSegura SAD</div>
            <div className="text-xs opacity-70">Apoio à decisão viária</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 text-xs opacity-60">Base simulada, estrutura RENAEST/RENACH/IBGE</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} className="whitespace-nowrap rounded px-3 py-1.5 text-sm" activeProps={{ className: "bg-primary text-primary-foreground" }}>
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export const fmt = (n: number, d = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

export function ComoCalculado({ tecnica, resumo, children }: { tecnica: string; resumo: string; children?: ReactNode }) {
  return (
    <Accordion type="single" collapsible className="mt-8 rounded-lg border bg-card px-4">
      <AccordionItem value="calc" className="border-b-0">
        <AccordionTrigger className="text-sm">Como isso foi calculado</AccordionTrigger>
        <AccordionContent>
          <div className="mb-4 text-sm"><span className="font-semibold">Técnica: {tecnica}.</span> <span className="text-muted-foreground">{resumo}</span></div>
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
