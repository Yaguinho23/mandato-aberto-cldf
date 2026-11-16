# Mandato Aberto · CLDF (MVP v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar na Vercel um site estático que mostra, para cada um dos 24 deputados distritais da legislatura 2023–2026, suas proposições e seus gastos de verba indenizatória, com fonte e data em cada número.

**Architecture:** Scripts TypeScript coletam dados públicos da CLDF, normalizam e gravam JSON em `data/`. Um site Next.js gerado estaticamente lê esses JSON. Um GitHub Action roda a coleta uma vez por dia e faz commit; a Vercel republica a cada commit.

**Tech Stack:** Node 20+, Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Recharts, Zod, Vitest, tsx. Tudo gratuito e de código aberto.

**Spec:** `docs/superpowers/specs/2026-11-16-mandato-aberto-cldf-design.md` (cópia do doc de projeto "Mandato Aberto CLDF - Design do MVP"). Leia o spec inteiro antes da Task 1.

## Global Constraints

- **Custo zero.** Nenhuma API, serviço ou plano pago. Sem chamadas a modelos de IA.
- Interface e textos em português do Brasil. Mobile primeiro.
- Aviso fixo no topo e no rodapé, com este texto exato: `Iniciativa independente. Não é um site oficial da CLDF.`
- Não usar brasão nem logomarca da CLDF.
- Nenhum ranking, nota, ordenação "melhor/pior" ou adjetivo sobre deputados. Listas de deputados sempre em ordem alfabética.
- Todo número exibido tem link de fonte e data de coleta no mesmo bloco.
- Valores monetários guardados como inteiros em centavos (`valorCentavos`); formatados só na exibição.
- Todo registro carrega `legislatura` (v1: sempre `"2023-2026"`).
- Coleta: no máximo uma vez por dia; no mínimo 1 segundo entre requisições ao mesmo host; header `User-Agent: MandatoAbertoCLDF/1.0 (+https://mandatoaberto.org; contato@mandatoaberto.org)`.
- Presença, votações e emendas ficam fora da v1; aparecem só como lacuna explicada.
- Repositório público no GitHub do Yago; projeto na Vercel do Yago (plano Hobby).

## Review Focus

1. **Autor que não casa com nenhum deputado** (coautoria, suplente, Mesa Diretora, Poder Executivo, grafia diferente): a proposição continua na lista geral com o texto original do autor e não é atribuída a ninguém; nunca atribuir por aproximação. → teste na Task 4.
2. **Coleta falha ou volta vazia** (API fora do ar, CSV mudou de formato): os JSON bons do dia anterior não são sobrescritos; `metadados.json` registra `ok: false` e o site mostra a data antiga. → teste na Task 6.
3. **Valores em formato brasileiro e lançamentos negativos** (`1.234,56`, `R$ 1.234,56`, glosas e estornos com sinal de menos, célula vazia): convertidos sem erro de arredondamento; célula vazia vira registro rejeitado, não zero. → teste na Task 2 e Task 5.
4. **Deputado sem registros** (suplente recém-empossado, licenciado, mês ainda não publicado): a página mostra `Nenhum registro publicado no período`, nunca `R$ 0,00` nem gráfico vazio. → teste na Task 7 e Task 9.
5. **URL de comparação inválida** (`/comparar?d=slug-inexistente`, slug repetido, mais de 4): ignora inválidos e repetidos, limita a 4, não quebra a página. → teste na Task 11.

---

## File Structure

```
docs/fontes.md                        formatos reais das fontes (Task 1)
docs/superpowers/specs/...design.md   spec
scripts/__fixtures__/                 amostras reais salvas na Task 1
scripts/http.ts                       fetch com user-agent, atraso e retry
scripts/transforma/nomes.ts           normalização de nomes e slugs
scripts/transforma/proposicoes.ts     bruto → Proposicao[]
scripts/transforma/verba.ts           bruto → DespesaVerba[]
scripts/coleta/deputados.ts           lê seed curado, confere com CSV oficial
scripts/coleta/proposicoes.ts         chama a API do PLe
scripts/coleta/verba.ts               baixa os CSV de verba
scripts/coletar.ts                    orquestra, valida, grava data/
data/curado/deputados.json            24 deputados, mantido à mão
data/{deputados,proposicoes,verba,metadados}.json   gerados
lib/types.ts  lib/schemas.ts          tipos e validação Zod
lib/formato.ts                        moeda e datas
lib/dados.ts                          leitura e agregações para as páginas
lib/glossario.ts                      termos e explicações
app/layout.tsx, app/page.tsx
app/deputados/[slug]/page.tsx
app/proposicoes/page.tsx
app/comparar/page.tsx
app/dados/page.tsx, app/sobre/page.tsx
components/                           AvisoIndependencia, Fonte, CartaoDeputado,
                                      GraficoGastos, ListaProposicoes, Termo, SemRegistros
.github/workflows/coleta.yml
```

---

### Task 1: Reconhecimento das fontes

Nada do formato das fontes foi inspecionado ainda. Esta task descobre o formato real; as seguintes dependem dela.

**Files:**
- Create: `docs/fontes.md`, `scripts/__fixtures__/ple-proposicoes.json`, `scripts/__fixtures__/verba-amostra.csv`, `scripts/__fixtures__/relacao-nominal-amostra.csv`
- Create: `docs/superpowers/specs/2026-11-16-mandato-aberto-cldf-design.md` (copiar o spec)

**Interfaces:**
- Produces: fixtures reais usados nos testes das Tasks 3–5; `docs/fontes.md` com, para cada fonte: URL exata, método, parâmetros, paginação, nomes dos campos, um registro de exemplo, licença/termos se houver.

- [ ] **Step 1:** `git init`, criar o repositório e copiar o spec para `docs/superpowers/specs/`.
- [ ] **Step 2:** Chamar `POST https://ple.cl.df.gov.br/pleservico/api/public/proposicao/filter` com corpo JSON filtrando `tipoProposicao: "PL"` e descobrir: campos retornados, como a autoria aparece (texto ou id), paginação, limite por página, se há campo de data e de situação, URL pública de cada proposição. Salvar uma resposta real (até 50 itens, com pelo menos um item de coautoria) em `ple-proposicoes.json`.
- [ ] **Step 3:** Abrir `https://dados.cl.df.gov.br/dataset/` e localizar os conjuntos "Verbas Indenizatórias" e "Relação nominal de deputados e servidores". Baixar o CSV mais recente de cada um; registrar separador, codificação, colunas, granularidade (por nota fiscal ou por mês) e padrão de URL por período. Salvar as primeiras 200 linhas de cada como fixture.
- [ ] **Step 4:** Verificar em `https://www.cl.df.gov.br` a página com a lista dos deputados (nome parlamentar, partido, foto). Registrar a URL em `docs/fontes.md`.
- [ ] **Step 5:** Consultar `github.com/maximusminus/relatorio-cldf` e anotar endpoints do PLe usados lá que não estejam na documentação oficial (para o experimento de presença pós-v1; não implementar).
- [ ] **Step 6: Portão.** Se a API não devolver autoria, ou se o CSV de verba não permitir separar por deputado, **pare e relate ao Yago** antes de seguir; o escopo muda.
- [ ] **Step 7:** Commit: `docs: reconhecimento das fontes da CLDF`.

---

### Task 2: Base do projeto, tipos, validação e formatação

**Files:**
- Create: projeto Next.js na raiz (`npx create-next-app@latest . --typescript --tailwind --app --eslint`), `vitest.config.ts`, `lib/types.ts`, `lib/schemas.ts`, `lib/formato.ts`
- Test: `lib/formato.test.ts`, `lib/schemas.test.ts`

**Interfaces:**
- Produces (`lib/types.ts`):

```ts
export type Legislatura = "2023-2026";
export type TipoProposicao = "PL" | "PLC" | "PDL" | "PR" | "IND" | "MO" | "RQ" | "OUTRO";

export interface Deputado {
  slug: string;            // "fulano-de-tal"
  nome: string;            // nome parlamentar
  partido: string | null;
  fotoUrl: string | null;
  legislatura: Legislatura;
  emExercicio: boolean;
  fonteUrl: string;
}
export interface Proposicao {
  id: string;              // id da fonte
  tipo: TipoProposicao;
  numero: string;
  ano: number;
  ementa: string;
  situacao: string | null;
  dataApresentacao: string | null;  // "AAAA-MM-DD"
  autoresTexto: string;             // texto original da fonte
  autores: string[];                // slugs de deputados reconhecidos; pode ser []
  urlFonte: string;
  legislatura: Legislatura;
  resumoSimples?: string;           // reservado; não preencher na v1
}
export interface DespesaVerba {
  deputadoSlug: string;
  ano: number;
  mes: number;             // 1–12
  categoria: string;
  fornecedor: string | null;
  valorCentavos: number;   // pode ser negativo (glosa/estorno)
  fonteUrl: string;
}
export interface FonteMeta {
  id: "deputados" | "proposicoes" | "verba";
  nome: string; url: string;
  coletadoEm: string;      // ISO 8601
  registros: number; ok: boolean; erro?: string;
}
export interface Metadados { geradoEm: string; fontes: FonteMeta[]; }
```

- Produces (`lib/schemas.ts`): `DeputadoSchema`, `ProposicaoSchema`, `DespesaVerbaSchema`, `MetadadosSchema` (Zod, espelhando os tipos acima).
- Produces (`lib/formato.ts`): `parseValorBR(texto: string): number | null`, `formatarBRL(centavos: number): string`, `formatarData(iso: string): string`, `nomeMes(mes: number): string`.

- [ ] **Step 1: Testes que falham** (`lib/formato.test.ts`)

```ts
expect(parseValorBR("1.234,56")).toBe(123456);
expect(parseValorBR("R$ 1.234,56")).toBe(123456);
expect(parseValorBR("-150,00")).toBe(-15000);
expect(parseValorBR("0,10")).toBe(10);
expect(parseValorBR("18.742,91")).toBe(1874291);
expect(parseValorBR("")).toBeNull();
expect(parseValorBR("abc")).toBeNull();
expect(formatarBRL(123456)).toBe("R$ 1.234,56");
expect(formatarBRL(-15000)).toBe("-R$ 150,00");
expect(formatarData("2026-03-05")).toBe("05/03/2026");
expect(nomeMes(3)).toBe("março");
```

`lib/schemas.test.ts`: `DespesaVerbaSchema` rejeita `mes: 13` e `valorCentavos: 10.5`; `ProposicaoSchema` aceita `autores: []`.

- [ ] **Step 2:** `npx vitest run` → FAIL (funções não definidas).
- [ ] **Step 3:** Implementar. `parseValorBR` trabalha com string e inteiros (sem `parseFloat * 100`). `formatarBRL` usa `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` e normaliza espaços não separáveis.
- [ ] **Step 4:** `npx vitest run` → PASS. `npm run build` → sucesso.
- [ ] **Step 5:** Commit: `feat: base do projeto, tipos e formatação`.

---

### Task 3: Deputados (seed curado + conferência)

**Files:**
- Create: `data/curado/deputados.json`, `scripts/transforma/nomes.ts`, `scripts/coleta/deputados.ts`
- Test: `scripts/transforma/nomes.test.ts`, `scripts/coleta/deputados.test.ts`

**Interfaces:**
- Consumes: `Deputado`, `DeputadoSchema`; fixture `relacao-nominal-amostra.csv`.
- Produces: `slugificar(nome: string): string`; `normalizarNome(nome: string): string` (minúsculas, sem acento, sem prefixos "deputado/deputada/dep.", espaços colapsados); `carregarDeputados(): Promise<Deputado[]>` (ordem alfabética por `nome`).

- [ ] **Step 1:** Preencher `data/curado/deputados.json` com os 24 deputados em exercício a partir da página oficial registrada na Task 1 (nome parlamentar, partido, URL da foto, `fonteUrl`). Incluir um campo `aliases: string[]` com as grafias que a fonte de proposições e a de verba usam para cada um (extraídas dos fixtures).
- [ ] **Step 2: Testes que falham**

```ts
expect(slugificar("José Antônio D'Ávila")).toBe("jose-antonio-davila");
expect(normalizarNome("Deputada  MARIA da Silva")).toBe("maria da silva");
expect(normalizarNome("Dep. João")).toBe("joao");
const deps = await carregarDeputados();
expect(deps).toHaveLength(24);
expect(new Set(deps.map(d => d.slug)).size).toBe(24);          // slugs únicos
expect(deps.map(d => d.nome)).toEqual([...deps.map(d => d.nome)].sort((a, b) => a.localeCompare(b, "pt-BR")));
```

- [ ] **Step 3:** `npx vitest run scripts` → FAIL.
- [ ] **Step 4:** Implementar. `carregarDeputados` valida cada item com `DeputadoSchema` e lança erro se houver slug repetido. Se o CSV oficial de relação nominal listar um deputado ausente do seed (ou o contrário), registrar aviso no console com os nomes; não falhar.
- [ ] **Step 5:** `npx vitest run scripts` → PASS.
- [ ] **Step 6:** Commit: `feat: lista curada de deputados`.

---

### Task 4: Proposições

**Files:**
- Create: `scripts/http.ts`, `scripts/transforma/proposicoes.ts`, `scripts/coleta/proposicoes.ts`
- Test: `scripts/transforma/proposicoes.test.ts`, `scripts/http.test.ts`

**Interfaces:**
- Consumes: `normalizarNome`, `Deputado` (com `aliases`), fixture `ple-proposicoes.json`, mapeamento de campos de `docs/fontes.md`.
- Produces: `buscar(url: string, init?: RequestInit): Promise<Response>` (aplica User-Agent, espera ≥1 s entre chamadas ao mesmo host, 3 tentativas com espera crescente, lança em status ≥ 400); `transformarProposicoes(bruto: unknown[], deputados: DeputadoComAliases[]): Proposicao[]`; `identificarAutores(autoresTexto: string, deputados: DeputadoComAliases[]): string[]`; `coletarProposicoes(deputados): Promise<Proposicao[]>` (de 01/01/2023 em diante, todas as páginas).

- [ ] **Step 1: Testes que falham**

```ts
// casamento exato por nome normalizado ou alias; nada por aproximação
expect(identificarAutores("Deputado Fulano de Tal", deps)).toEqual(["fulano-de-tal"]);
expect(identificarAutores("Fulano de Tal, Beltrana Souza", deps)).toEqual(["beltrana-souza", "fulano-de-tal"]);
expect(identificarAutores("Poder Executivo", deps)).toEqual([]);
expect(identificarAutores("Mesa Diretora", deps)).toEqual([]);
expect(identificarAutores("Fulano de Tao", deps)).toEqual([]);      // grafia diferente: não atribui
// transformação sobre o fixture real
const ps = transformarProposicoes(fixture, deps);
expect(ps.length).toBe(fixture.length);                              // nenhuma proposição descartada
expect(ps.every(p => p.legislatura === "2023-2026")).toBe(true);
expect(ps.every(p => p.urlFonte.startsWith("https://"))).toBe(true);
expect(ps.find(p => p.autores.length === 0)?.autoresTexto).toBeTruthy(); // texto original preservado
// tipo desconhecido vira "OUTRO", não erro
expect(transformarProposicoes([{ ...fixture[0], [campoTipo]: "XYZ" }], deps)[0].tipo).toBe("OUTRO");
```

`scripts/http.test.ts` (com `fetch` simulado): envia o User-Agent da seção Global Constraints; tenta 3 vezes em erro 500 e então lança; duas chamadas seguidas ao mesmo host ficam ≥ 1000 ms separadas (usar timers falsos).

- [ ] **Step 2:** `npx vitest run scripts` → FAIL.
- [ ] **Step 3:** Implementar. O separador de coautores e os nomes dos campos vêm de `docs/fontes.md`. `identificarAutores` devolve slugs em ordem alfabética, sem repetição.
- [ ] **Step 4:** `npx vitest run scripts` → PASS.
- [ ] **Step 5:** Rodar a coleta real uma vez (`npx tsx scripts/coleta/proposicoes.ts`), conferir contagem por tipo e a proporção de proposições sem autor reconhecido. Se passar de 15%, revisar `aliases` no seed e registrar o motivo em `docs/fontes.md`.
- [ ] **Step 6:** Commit: `feat: coleta e transformação de proposições`.

---

### Task 5: Verba indenizatória

**Files:**
- Create: `scripts/transforma/verba.ts`, `scripts/coleta/verba.ts`
- Test: `scripts/transforma/verba.test.ts`

**Interfaces:**
- Consumes: `parseValorBR`, `normalizarNome`, `buscar`, fixture `verba-amostra.csv`.
- Produces: `transformarVerba(csv: string, deputados: DeputadoComAliases[], fonteUrl: string): { despesas: DespesaVerba[]; rejeitadas: { linha: number; motivo: string }[] }`; `coletarVerba(deputados): Promise<{ despesas: DespesaVerba[]; rejeitadas: ... }>` (2023 até o mês mais recente publicado).

- [ ] **Step 1: Testes que falham**

```ts
const { despesas, rejeitadas } = transformarVerba(fixtureCsv, deps, URL);
expect(despesas.length + rejeitadas.length).toBe(linhasDeDadosDoFixture); // nada some sem registro
expect(despesas.every(d => Number.isInteger(d.valorCentavos))).toBe(true);
expect(despesas.every(d => d.mes >= 1 && d.mes <= 12)).toBe(true);
// linha com valor vazio é rejeitada, não vira zero
expect(transformarVerba(csvComValorVazio, deps, URL).rejeitadas[0].motivo).toMatch(/valor/i);
// linha de deputado não reconhecido é rejeitada com o nome no motivo
expect(transformarVerba(csvComNomeEstranho, deps, URL).rejeitadas[0].motivo).toMatch(/Nome Estranho/);
// valor negativo é mantido
expect(transformarVerba(csvComEstorno, deps, URL).despesas[0].valorCentavos).toBeLessThan(0);
```

- [ ] **Step 2:** `npx vitest run scripts` → FAIL.
- [ ] **Step 3:** Implementar. Detectar codificação e separador conforme `docs/fontes.md` (CSV de órgão público costuma vir em ISO-8859-1 com `;`). Se a fonte for consolidada por mês e não por nota, `fornecedor` fica `null` e `categoria` recebe o rótulo da fonte.
- [ ] **Step 4:** `npx vitest run scripts` → PASS.
- [ ] **Step 5:** Rodar a coleta real; conferir à mão o total de um deputado em um mês contra o demonstrativo oficial publicado em `cl.df.gov.br/web/portal-transparencia/verbas-indenizatorias`. Registrar a conferência em `docs/fontes.md`.
- [ ] **Step 6:** Commit: `feat: coleta e transformação de verba indenizatória`.

---

### Task 6: Orquestrador à prova de falha

**Files:**
- Create: `scripts/coletar.ts`; adicionar `"coletar": "tsx scripts/coletar.ts"` ao `package.json`
- Test: `scripts/coletar.test.ts`

**Interfaces:**
- Consumes: `carregarDeputados`, `coletarProposicoes`, `coletarVerba`, schemas.
- Produces: `executarColeta(deps: { coletores; dirSaida: string; agora: () => Date }): Promise<Metadados>`; arquivos `data/deputados.json`, `data/proposicoes.json`, `data/verba.json`, `data/metadados.json`.

- [ ] **Step 1: Testes que falham** (diretório temporário, coletores simulados)

```ts
// coletor de verba lança erro → verba.json antigo permanece byte a byte
// metadados.fontes.find(f => f.id === "verba") → { ok: false, erro: <mensagem>, coletadoEm: <data ANTIGA> }
// proposicoes.json é atualizado normalmente na mesma execução
// coletor devolve [] → tratado como falha (não grava lista vazia)
// coletor devolve item que não passa no schema → tratado como falha
// queda de mais de 30% em `registros` versus a execução anterior → tratado como falha
// tudo certo → os 4 arquivos gravados, todas as fontes ok: true, geradoEm = agora()
```

- [ ] **Step 2:** `npx vitest run scripts/coletar.test.ts` → FAIL.
- [ ] **Step 3:** Implementar. Cada fonte é independente; gravar em arquivo temporário e renomear. JSON com chaves e itens em ordem estável (commits diários com diff pequeno). O processo sai com código 0 mesmo com falha parcial e com código 1 só se todas as fontes falharem.
- [ ] **Step 4:** `npx vitest run` → PASS. `npm run coletar` → gera `data/` real.
- [ ] **Step 5:** Commit (incluindo `data/`): `feat: orquestrador de coleta e primeira carga`.

---

### Task 7: Camada de dados do site

**Files:**
- Create: `lib/dados.ts`
- Test: `lib/dados.test.ts`

**Interfaces:**
- Consumes: os 4 JSON de `data/`, tipos.
- Produces:

```ts
listarDeputados(): Deputado[]                       // ordem alfabética
obterDeputado(slug: string): Deputado | undefined
proposicoesDe(slug: string): Proposicao[]           // mais recentes primeiro
listarProposicoes(f?: { tipo?: TipoProposicao; ano?: number; autor?: string }): Proposicao[]
resumoVerba(slug: string, ano: number): {
  totalCentavos: number;
  porMes: { mes: number; centavos: number }[];      // só meses com registro
  porCategoria: { categoria: string; centavos: number }[]; // maior → menor
} | null                                            // null = nenhum registro
anosComVerba(slug: string): number[]
resumoDeputado(slug: string, ano: number): { proposicoes: number; porTipo: Record<TipoProposicao, number>; verba: ReturnType<typeof resumoVerba> }
obterMetadados(): Metadados
normalizarSelecao(param: string | string[] | undefined): string[]  // para /comparar
```

- [ ] **Step 1: Testes que falham** (dados pequenos injetados)

```ts
expect(resumoVerba("sem-registros", 2026)).toBeNull();                 // não { totalCentavos: 0 }
expect(resumoVerba("fulano", 2026)!.totalCentavos).toBe(somaManual);
expect(resumoVerba("com-estorno", 2026)!.totalCentavos).toBe(valor + estornoNegativo);
expect(proposicoesDe("fulano").map(p => p.id)).toContain(idCoautoria); // coautoria conta para ambos
expect(listarProposicoes({ autor: "fulano", tipo: "PL" }).every(p => p.tipo === "PL")).toBe(true);
expect(normalizarSelecao("a,inexistente,a,b,c,d,e")).toEqual(["a", "b", "c", "d"]);
expect(normalizarSelecao(undefined)).toEqual([]);
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5:** Commit: `feat: camada de dados`.

---

### Task 8: Layout, tela inicial e escolha de paleta

**Files:**
- Create: `app/layout.tsx`, `app/page.tsx`, `components/AvisoIndependencia.tsx`, `components/Fonte.tsx`, `components/CartaoDeputado.tsx`, `components/BuscaDeputados.tsx`, `app/paleta/page.tsx` (temporária)
- Modify: `app/globals.css` (tokens de cor)
- Test: `components/Fonte.test.tsx`, `components/AvisoIndependencia.test.tsx`

**Interfaces:**
- Consumes: `listarDeputados`, `obterMetadados`, `formatarData`.
- Produces: `<Fonte id="verba" />` (renderiza `Fonte: <link> · Dados de DD/MM/AAAA`; se `ok === false`, acrescenta `· atualização mais recente falhou`); `<AvisoIndependencia />`; `<CartaoDeputado deputado />`.

Referência visual (mandatoaberto.org): fundo branco com manchas suaves em degradê, selo arredondado acima do título, título grande em negrito, botões arredondados, cartões brancos com borda clara, raio 0,5rem, fonte de sistema sem serifa. Navegação: `Deputados · Proposições · Comparar · Sobre os dados`. Título do site: `Mandato Aberto · CLDF`.

- [ ] **Step 1: Testes que falham:** `AvisoIndependencia` contém o texto exato das Global Constraints; `Fonte` mostra link e data, e mostra o aviso de falha quando `ok` é falso.
- [ ] **Step 2–3:** FAIL → implementar layout (aviso no topo e no rodapé), início com missão, busca por nome (filtra a grade no cliente, ignorando acentos), grade dos 24 em ordem alfabética, três números gerais com `<Fonte />`.
- [ ] **Step 4:** Criar `/paleta` mostrando a tela inicial em duas variações lado a lado: **A** verde escuro + detalhe amarelo-ouro (cores da bandeira do DF); **B** azul e verde em tons mais escuros que os do site nacional. Ambas com contraste WCAG AA em texto e botões.
- [ ] **Step 5:** `npx vitest run` → PASS; `npm run build` → sucesso.
- [ ] **Step 6: Portão.** Mostrar `/paleta` ao Yago e **esperar a escolha**. Aplicar a escolhida em `globals.css`, apagar `app/paleta/`.
- [ ] **Step 7:** Commit: `feat: layout, tela inicial e paleta`.

---

### Task 9: Página do deputado

**Files:**
- Create: `app/deputados/[slug]/page.tsx`, `components/GraficoGastos.tsx`, `components/ListaProposicoes.tsx`, `components/SemRegistros.tsx`, `components/BlocoResumo.tsx`
- Test: `components/GraficoGastos.test.tsx`, `app/deputados/pagina.test.tsx`

**Interfaces:**
- Consumes: `obterDeputado`, `resumoDeputado`, `proposicoesDe`, `anosComVerba`, `<Fonte />`.
- Produces: `generateStaticParams()` com os 24 slugs; `<SemRegistros />` com o texto exato `Nenhum registro publicado no período`; `<ListaProposicoes itens limite? />`; `<GraficoGastos porMes porCategoria />`.

- [ ] **Step 1: Testes que falham:** deputado com `verba === null` renderiza `Nenhum registro publicado no período` e não renderiza `R$ 0,00`; `GraficoGastos` renderiza uma `<table>` com os mesmos valores do gráfico; slug inexistente chama `notFound()`; o bloco de presença mostra `Presença: publicada pela CLDF apenas em PDF` com link para `https://www.cl.df.gov.br/sessoes-plenarias`.
- [ ] **Step 2–3:** FAIL → implementar: cabeçalho (foto com `alt`, nome, partido, legislatura); três blocos (proposições no ano, verba no ano, presença como lacuna); seletor de ano; gráfico de barras por mês e lista por categoria; últimas 10 proposições com link "ver todas" para `/proposicoes?autor=<slug>`; `<Fonte />` em cada bloco; link `Encontrou um erro?` → `mailto:contato@mandatoaberto.org` com o nome do deputado no assunto.
- [ ] **Step 4:** PASS + `npm run build` gera as 24 páginas.
- [ ] **Step 5:** Commit: `feat: página do deputado`.

---

### Task 10: Proposições e glossário

**Files:**
- Create: `lib/glossario.ts`, `components/Termo.tsx`, `app/proposicoes/page.tsx`, `components/FiltrosProposicoes.tsx`
- Test: `lib/glossario.test.ts`, `components/FiltrosProposicoes.test.tsx`

**Interfaces:**
- Consumes: `listarProposicoes`, `listarDeputados`, `<ListaProposicoes />`.
- Produces: `GLOSSARIO: Record<string, { termo: string; explicacao: string }>`; `explicarTipo(tipo: TipoProposicao): string`; `<Termo id="verba-indenizatoria">…</Termo>` (explicação ao tocar ou focar, acessível por teclado).

Textos do glossário (exatos):

| id | explicação |
|---|---|
| PL | Projeto de Lei: proposta de nova lei ou de mudança em uma lei do DF. |
| PLC | Projeto de Lei Complementar: detalha pontos da Lei Orgânica do DF; exige mais votos para ser aprovado. |
| PDL | Projeto de Decreto Legislativo: decisão que cabe só à Câmara Legislativa, sem sanção do governador. |
| PR | Projeto de Resolução: trata de regras internas da própria Câmara. |
| IND | Indicação: pedido para que o governo faça algo, como uma obra ou um serviço. Não obriga o governo. |
| MO | Moção: manifestação de apoio, aplauso ou repúdio. Não cria regra. |
| RQ | Requerimento: pedido formal, como informações a um órgão ou a realização de uma audiência. |
| OUTRO | Outro tipo de documento legislativo. |
| verba-indenizatoria | Dinheiro que a Câmara devolve ao deputado por despesas do gabinete, como aluguel, combustível e consultorias, depois que ele comprova o gasto. |
| ementa | Resumo oficial, de uma frase, do que a proposição trata. |

- [ ] **Step 1: Testes que falham:** `explicarTipo` cobre todos os valores de `TipoProposicao`; filtro lê e grava `tipo`, `ano` e `autor` na query string; combinação sem resultado mostra `Nenhuma proposição encontrada com esses filtros`; lista pagina de 50 em 50.
- [ ] **Step 2–3:** FAIL → implementar. Cada item: tipo com `<Termo>`, número/ano, ementa oficial, autores (links para os deputados reconhecidos; texto original para os demais), situação, data, link `Ver no site da CLDF`.
- [ ] **Step 4:** PASS + build.
- [ ] **Step 5:** Commit: `feat: proposições e glossário`.

---

### Task 11: Comparar

**Files:**
- Create: `app/comparar/page.tsx`, `components/SeletorDeputados.tsx`, `components/TabelaComparacao.tsx`
- Test: `components/TabelaComparacao.test.tsx`

**Interfaces:**
- Consumes: `normalizarSelecao`, `resumoDeputado`, `listarDeputados`.
- Produces: rota `/comparar?d=slug-a,slug-b` (2 a 4 deputados).

- [ ] **Step 1: Testes que falham:** colunas aparecem na ordem em que foram escolhidas (nunca reordenadas por valor); nenhuma célula recebe destaque de "maior" ou "menor"; deputado sem verba mostra `Nenhum registro publicado no período` na célula; com menos de 2 válidos mostra `Escolha pelo menos dois deputados`; `?d=inexistente,a,a` renderiza só `a` e a mensagem anterior.
- [ ] **Step 2–3:** FAIL → implementar. Linhas: proposições no ano (total e por tipo), verba no ano (total), verba por categoria. Seletor de ano. `<Fonte />` abaixo da tabela. No celular, a tabela rola na horizontal com a primeira coluna fixa.
- [ ] **Step 4:** PASS + build.
- [ ] **Step 5:** Commit: `feat: comparação de deputados`.

---

### Task 12: Sobre os dados e Sobre

**Files:**
- Create: `app/dados/page.tsx`, `app/sobre/page.tsx`
- Test: `app/dados/pagina.test.tsx`

**Interfaces:**
- Consumes: `obterMetadados`, glossário.

- [ ] **Step 1: Testes que falham:** `/dados` lista as três fontes com link, data e número de registros; fonte com `ok: false` aparece marcada como `Última atualização falhou`; a seção de lacunas cita presença, votações nominais e emendas.
- [ ] **Step 2–3:** FAIL → implementar. `/dados`: tabela de fontes; "O que ainda falta e por quê" (presença e votações: publicadas só em PDF; emendas: fonte aberta não confirmada); "Como tratamos os dados" (autoria só por casamento exato; valores em centavos; nada é estimado); proporção de proposições sem autor reconhecido; como reportar erro. `/sobre`: o projeto, ligação com mandatoaberto.org, princípios (transparência, independência partidária, acesso público, participação cidadã), contato `contato@mandatoaberto.org` e Instagram `@mandatoaberto`. Não inventar números de impacto, prêmios ou parcerias.
- [ ] **Step 4:** PASS + build.
- [ ] **Step 5:** Commit: `feat: páginas de dados e sobre`.

---

### Task 13: Atualização diária e publicação

**Files:**
- Create: `.github/workflows/coleta.yml`, `.github/workflows/ci.yml`, `README.md`

- [ ] **Step 1:** `ci.yml`: em todo push e PR, `npm ci`, `npx vitest run`, `npm run build`.
- [ ] **Step 2:** `coleta.yml`: `schedule: cron "17 9 * * *"` (06:17 em Brasília) e `workflow_dispatch`; `permissions: contents: write`; roda `npm ci && npm run coletar`; faz commit de `data/` só se houver diferença, com mensagem `dados: atualização AAAA-MM-DD`.
- [ ] **Step 3:** `README.md`: o que é, como rodar (`npm install`, `npm run coletar`, `npm run dev`), fontes, aviso de independência, licença do código (MIT).
- [ ] **Step 4: Com o Yago** (ações na conta dele, pedir confirmação a cada uma): criar o repositório público no GitHub e fazer push; importar o repositório na Vercel (plano Hobby); conferir o primeiro deploy.
- [ ] **Step 5:** Disparar `coleta.yml` manualmente; verificar que o commit de dados aparece e que a Vercel republica.
- [ ] **Step 6: Subdomínio (depende de quem administra o DNS de mandatoaberto.org):** adicionar `cldf.mandatoaberto.org` em Domains no projeto da Vercel e passar ao administrador o registro CNAME que a Vercel indicar. Até lá, usar o endereço `*.vercel.app`.
- [ ] **Step 7: Verificação final:** abrir no celular a tela inicial, três perfis (um com muitos registros, um com poucos, um suplente se houver), `/proposicoes` com filtro, `/comparar` com três deputados e `/dados`; conferir um total de verba e uma contagem de proposições contra a fonte oficial. Rodar Lighthouse (acessibilidade ≥ 90).
- [ ] **Step 8:** Commit: `ci: coleta diária e publicação`.

---

## Depois da v1 (não implementar agora)

Experimento de presença 2026: extrair as listas de presença em PDF de `cl.df.gov.br/sessoes-plenarias`, marcar como experimental e pôr o link do PDF de origem em cada linha. Exige spec e plano próprios.
