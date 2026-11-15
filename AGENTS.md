# Diretrizes de Desenvolvimento — ViaSegura SAD

Instruções para agentes e desenvolvedores trabalhando no repositório ViaSegura SAD.

## Arquitetura do Projeto

- **Framework:** TanStack Start (React 19 + TypeScript) com Vite.
- **Roteamento:** Baseado em arquivos sob `src/routes/`. A rota raiz é `src/routes/__root.tsx`. O arquivo `src/routes/routeTree.gen.ts` é gerado automaticamente.
- **Estilização:** Tailwind CSS v4, Lucide React (ícones), Radix UI / Shadcn UI components em `src/components/ui/`.
- **Gráficos & Visualização:** Recharts.
- **Exportação:** jsPDF e jsPDF-AutoTable.
- **Testes:** Vitest + React Testing Library + JSDOM (`npm test`).

## Regras e Boas Práticas

1. **Roteamento:** Não crie diretórios como `src/pages/` ou convenções de Next.js/Remix. As rotas residem em `src/routes/`.
2. **Componentes:** Componentes compartilhados e layout ficam em `src/components/` e utilitários em `src/lib/`.
3. **Dados & Modelagem Estatística:** A lógica analítica (K-means, regressão linear múltipla, correlação de Pearson, cálculo de índices de risco e alocação orçamentária) fica centralizada em `src/lib/stats.ts`, `src/lib/sad.tsx`, `src/lib/simulador.ts` e `src/lib/data.ts`.
4. **Segurança de Código:** Não exponha chaves ou dados sensíveis em arquivos versionados.
