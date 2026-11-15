# ViaSegura SAD — Sistema de Apoio à Decisão para Segurança Viária Municipal

O **ViaSegura SAD** é uma plataforma analítica desenvolvida para auxiliar gestores públicos e autoridades de trânsito na formulação, priorização e alocação orçamentária de intervenções de segurança viária em municípios brasileiros.

Inspirado na estrutura de dados do **RENAEST** (Registro Nacional de Acidentes e Estatísticas de Trânsito), **RENACH** (Registro Nacional de Carteiras de Habilitação) e dados demográficos e de frota do **IBGE/SENATRAN**, o sistema aplica métodos estatísticos, aprendizado de máquina (clustering e regressão) e modelos de otimização orçamentária para transformar dados brutos em decisões de investimento claras e justificadas.

---

## 🎯 Principais Funcionalidades

### 1. Onde Agir Primeiro? (`/`)
- **Ranking de Priorização:** Ordenação dos municípios com base em um índice ponderado de risco viário (considerando acidentes previstos, taxa de mortalidade, percentual de condutores jovens e tamanho da frota).
- **Alocação Orçamentária Automatizada:** Distribuição inteligente de recursos sob restrição de teto orçamentário configurável pelo usuário.
- **Recomendações Automatizadas de Ação:** Sugestão de intervenção (Fiscalização intensiva + educação, Campanhas direcionadas de CNH ou Monitoramento contínuo) com custo e justificativa técnica baseada no cluster do município.
- **Exportação de Relatórios:** Geração de relatórios executivos em formato **PDF** (tabela detalhada com layout executivo) e planilhas **CSV**.
- **Importação de Base Personalizada:** Possibilidade de carregar arquivos CSV próprios ou baixar a base ativa.

### 2. Panorama do Estado (`/visao-geral`)
- **Estatística Descritiva:** Média, mediana, desvio padrão, coeficiente de variação (CV), mínimos e máximos de cada indicador.
- **Histogramas Interativos:** Distribuição de frequências por faixas de valores para acidentes, proporção de jovens e idosos, frota e mortalidade.

### 3. Perfis de Municípios (`/perfis`)
- **Agrupamento K-means:** Segmentação dos municípios em perfis homogêneos de risco com número de grupos ($K$) ajustável de 2 a 6.
- **Gráfico do Cotovelo (Elbow Method):** Avaliação da Soma de Quadrados Intra-cluster (WSS) para apoiar a escolha do melhor número de clusters.
- **Gráfico de Dispersão (% Jovens × Acidentes):** Visualização clara do posicionamento dos grupos.

### 4. O Que Pesa nos Acidentes? (`/associacoes`)
- **Matriz de Correlação de Pearson:** Mensuração da força e direção da relação entre as variáveis demográficas/frota e a ocorrência de acidentes.
- **Testes de Hipótese:** P-valores com nível de significância a 5% para identificar relações estatisticamente robustas versus ruído amostral.

### 5. Simulador de Cenários (`/modelo`)
- **Análise *What-If* Municipal:** Simulação de intervenções em 6 alavancas viárias:
  - Fotossensores e radares;
  - Semáforos inteligentes;
  - Faixas de pedestres elevadas;
  - Requalificação de calçadas;
  - Motofaixas exclusivas;
  - Operações de fiscalização e autuações.
- **Impacto Previsto:** Projeção de redução percentual e absoluta de acidentes e mortes evitadas.
- **Análise de Custo-Benefício:** Sugestão de intervenções mais eficientes dentro do orçamento com base na métrica de mortes evitadas por milhão investido.
- **Benchmarking de Pares:** Comparação direta do município selecionado com outros do mesmo perfil/cluster.

### 6. Confiabilidade do Sistema (`/validacao`)
- **Validação Cruzada Treino/Teste (80/20):** Avaliação da capacidade preditiva fora da amostra do modelo de regressão linear múltipla ($R^2$ e Erro Médio Absoluto - MAE).
- **Análise de Silhueta:** Diagnóstico da qualidade e coesão dos clusters K-means gerados.

### 7. Metodologia (`/sobre`)
- Detalhamento didático das 4 etapas do fluxo de decisão (Dados $\rightarrow$ Análises $\rightarrow$ Modelo de Decisão $\rightarrow$ Recomendação).

---

## 🛠️ Tecnologias Utilizadas

- **Framework Web:** [TanStack Start](https://tanstack.com/start) (Fullstack React com SSR)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (tipagem estática rigorosa)
- **Biblioteca UI:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes:** Radix UI primitives / Shadcn UI, [Lucide React](https://lucide.dev/) (ícones)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Exportação:** [jsPDF](https://github.com/parallax/jsPDF) e [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Bundler & Dev Server:** [Vite](https://vite.dev/)
- **Testes Unitários e de Integração:** [Vitest](https://vitest.dev/) com [Testing Library](https://testing-library.com/) e JSDOM

---

## 📋 Pré-requisitos

Para executar o projeto em seu ambiente local, certifique-se de possuir:

- **Node.js**: versão **18.0.0** ou superior (recomendado: Node.js 20 LTS ou 22 LTS).
- **Gerenciador de Pacotes**: `npm` (incluso no Node.js), ou alternativamente `bun`, `pnpm` ou `yarn`.

Verifique as versões instaladas no terminal:
```bash
node -v
npm -v
```

---

## 🚀 Instruções de Execução

### 1. Clonar ou Acessar a Pasta do Projeto
Navegue até o diretório raiz do projeto:
```bash
cd ViaSeguraSAD
```

### 2. Instalar as Dependências
Execute o comando de instalação de pacotes:
```bash
npm install
```
*(Caso utilize Bun: `bun install` | Caso utilize pnpm: `pnpm install`)*

### 3. Iniciar o Servidor de Desenvolvimento
Inicie o servidor de desenvolvimento local:
```bash
npm run dev
```

Após iniciar, o terminal exibirá o endereço local (por padrão, `http://localhost:3000` ou similar). Abra o link no seu navegador.

### 4. Executar os Testes Automatizados
O projeto conta com suíte de testes unitários para a lógica analítica e roteamento:
```bash
# Execução única dos testes:
npm test

# Execução interativa (modo watch):
npm run test:watch
```

### 5. Compilar para Produção (Build)
Para gerar a versão otimizada de produção:
```bash
npm run build
```

Para pré-visualizar a versão compilada de produção localmente:
```bash
npm run preview
```

### 6. Linting e Formatação de Código
```bash
# Verificar boas práticas e tipagem com ESLint:
npm run lint

# Formatar automaticamente o código com Prettier:
npm run format
```

---

## 📊 Formato de Dados para Importação CSV

Para carregar dados municipais próprios na tela **Onde agir primeiro?**, prepare um arquivo no formato CSV (delimitado por vírgula `,` ou ponto e vírgula `;`) com as seguintes colunas no cabeçalho:

| Coluna | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `nome` | Texto | Nome do município | `Porto Feliz` |
| `uf` | Texto | Sigla do estado (2 caracteres) | `SP` |
| `porte` | Texto | Porte do município (`pequeno`, `médio` ou `grande`) | `médio` |
| `acidentes` | Numérico | Número anual de sinistros de trânsito | `342` |
| `pctJovens` | Numérico | % de condutores habilitados com até 25 anos | `17.4` |
| `pctIdosos` | Numérico | % de condutores habilitados com 60+ anos | `14.2` |
| `frota` | Numérico | Quantidade total de veículos registrados | `48200` |
| `mortalidade` | Numérico | Taxa de óbitos no trânsito por 100 mil habitantes | `16.8` |
| `populacao` | Numérico *(opcional)* | População total estimada | `95000` |

> Requisito mínimo: O arquivo deve conter ao menos **10 municípios** para que os modelos estatísticos e agrupamentos possam convergir com consistência.

---

## 📁 Estrutura de Diretórios

```
ViaSeguraSAD/
├── public/                 # Ativos estáticos públicos (favicons, etc.)
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # Componentes de interface (Radix / Shadcn)
│   │   └── AppShell.tsx    # Layout base com menu lateral e navegação
│   ├── hooks/              # Custom hooks React
│   ├── lib/                # Lógica de negócio, estatística e modelos
│   │   ├── data.ts         # Geração da base simulada e utilitários CSV
│   │   ├── sad.tsx         # Contexto global, indexação de risco e alocação orçamentária
│   │   ├── simulador.ts    # Modelagem matemática das alavancas viárias
│   │   ├── stats.ts        # Algoritmos estatísticos (K-means, regressão OLS, Pearson, etc.)
│   │   └── utils.ts        # Utilitários de classes CSS e formatação
│   ├── routes/             # Rotas TanStack Start baseadas em arquivos
│   │   ├── __root.tsx      # Rota raiz, cabeçalhos HTML e contexto global
│   │   ├── index.tsx       # Tela inicial: Onde agir primeiro?
│   │   ├── visao-geral.tsx # Panorama do estado
│   │   ├── perfis.tsx      # Perfis de municípios (K-means)
│   │   ├── associacoes.tsx # O que pesa nos acidentes (correlações)
│   │   ├── modelo.tsx      # Simulador de cenários e alavancas
│   │   ├── validacao.tsx   # Confiabilidade e validação treino/teste
│   │   └── sobre.tsx       # Metodologia e fluxo do SAD
│   ├── test/               # Suíte de testes automatizados (Vitest)
│   ├── router.tsx          # Instanciação do roteador TanStack Router
│   ├── server.ts           # Ponto de entrada do servidor SSR
│   ├── start.ts            # Configuração e middlewares TanStack Start
│   └── styles.css          # Estilização global e Tailwind CSS
├── bunfig.toml             # Configuração para execução opcional com Bun
├── package.json            # Dependências e scripts do projeto
├── tsconfig.json           # Configurações do compilador TypeScript
├── vite.config.ts          # Configuração do Vite e TanStack Start
└── vitest.config.ts        # Configuração do ambiente de testes Vitest
```

---

## 📄 Licença

Este projeto é de uso exclusivo para fins de planejamento, pesquisa e gestão de segurança viária.
