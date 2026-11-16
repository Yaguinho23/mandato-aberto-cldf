# Mandato Aberto · CLDF — Design do MVP

Data: 16/11/2026 · Status: **aprovado pelo Yago em 16/11/2026** · Destino: briefing para o Claude Code

Restrição geral: **só ferramentas gratuitas.** Nenhuma API ou serviço que exija pagamento.

## 1. Intenção

Criar uma versão do Mandato Aberto dedicada à Câmara Legislativa do Distrito Federal (CLDF), que mostre em linguagem simples o que cada deputado distrital faz no mandato, usando só dados públicos oficiais.

Por quê:

- Começar por um recorte regional, menor e mais fácil de cobrir por inteiro (24 deputados) do que a Câmara Federal.
- Ter algo funcionando para buscar apoio da própria CLDF no início da legislatura de 2027.
- Contribuir para um governo mais transparente no DF.

Caminho de validação: (1) Yago testa sozinho; (2) mostra a pessoas próximas que trabalham com monitoramento político; (3) só depois procura deputados e membros do governo.

Consequência para o produto: **um número errado sobre um deputado custa mais do que uma seção faltando.** Na dúvida, mostrar menos e apontar a fonte.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos da v1**

- Perfil de cada um dos 24 deputados da legislatura atual (2023–2026).
- Proposições de cada deputado, com o tipo explicado em linguagem simples, a ementa oficial e link para o original.
- Gastos de verba indenizatória por deputado, por mês e por categoria.
- Comparação lado a lado entre deputados.
- Página "Sobre os dados": origem, data de atualização e lacunas.
- Publicado na Vercel, com atualização automática dos dados.
- Pronto para receber a legislatura de 2027 sem reescrita.

**Não-objetivos da v1**

- Presença em plenário e votações nominais (só existem em PDF). Presença de 2026 é o primeiro experimento depois da v1.
- Emendas parlamentares (fonte aberta ainda não confirmada).
- Promessas de campanha, login, comentários, app móvel.
- Dados do Executivo do DF.

**Anti-objetivos (fariam o projeto falhar mesmo funcionando)**

- Parecer site oficial da CLDF.
- Rankings ou notas de "melhor/pior deputado", ou qualquer texto opinativo.
- Número sem fonte e sem data.
- Resumo de IA apresentado como se fosse texto oficial.

## 3. Caminhos considerados

| Caminho | O que entrega | Custo/risco | Decisão |
|---|---|---|---|
| 1. Só dados estruturados | Perfis, proposições, verba indenizatória | Sem presença nem votos | **Escolhido pelo Yago** |
| 2. Tudo, extraindo PDFs | Inclui presença e votações | Extração erra; erro em voto ou ausência de pessoa nomeada é grave | Descartado por ora |
| 3. Caminho 1 + amostra | Presença de 2026, marcada como experimental | Risco contido | **Próxima etapa, depois da v1** |

Motivo da escolha: confiabilidade primeiro. A lacuna de presença e votações, mostrada de forma explícita, vira argumento na conversa com a CLDF ("estes dados só são publicados em PDF").

## 4. Fontes de dados

| Dado | Fonte | Formato | Confiança |
|---|---|---|---|
| Proposições (2021+) | `POST https://ple.cl.df.gov.br/pleservico/api/public/proposicao/filter` — parâmetros documentados: autoria, assunto, numeroProposicao, numeroDocumento, tipoProposicao, tipoDocumento | API REST (JSON) | Confirmado na documentação do portal |
| Proposições (anos anteriores) | dados.cl.df.gov.br → conjunto "Proposições" | Arquivos por ano | Confirmado |
| Verba indenizatória | dados.cl.df.gov.br → conjunto "Verbas Indenizatórias" | CSV, XLSX, PDF | Existe; **colunas a inspecionar** |
| Lista de deputados | dados.cl.df.gov.br → "Relação nominal de deputados e servidores" | CSV mensal | Existe; **provavelmente sem partido e foto** |
| Partido, foto, contato | Páginas dos deputados em cl.df.gov.br | HTML | **A verificar** |
| Presença | cl.df.gov.br/sessoes-plenarias | PDF por sessão | Fora da v1 |
| Votações nominais | Anexos das atas no Diário da Câmara Legislativa | PDF | Fora da v1 |

Tipos de proposição: PL, PLC, PDL, PR, IND (indicação), MO (moção), RQ (requerimento).

Pontos de atenção:

- **O primeiro passo do Claude Code é inspecionar as fontes de verdade** (chamar a API, baixar um CSV de verba) e registrar o formato real antes de modelar qualquer coisa. Nada do esquema deve ser presumido.
- O portal dados.cl.df.gov.br bloqueia robôs no `robots.txt`. A coleta deve ser leve: uma vez por dia, com identificação no user-agent e contato do projeto. É um bom tema para levar à CLDF.
- O repositório público `github.com/maximusminus/relatorio-cldf` obtém votações e sessões por requisições não autenticadas. Vale olhar como referência de quais endpoints do PLe existem além do documentado.
- Se partido e foto não vierem de fonte estruturada, usar um arquivo curado `data/deputados.json` com os 24 nomes, cada um com link da fonte.

## 5. Páginas

```
[ Mandato Aberto · CLDF ]      Deputados  Proposições  Comparar  Sobre os dados
Iniciativa independente. Não é um site oficial da CLDF.
```

1. **Início** — frase de missão, aviso de independência, busca por nome, grade com os 24 deputados (foto, nome, partido), três números gerais (proposições no ano, verba usada no ano, data da última atualização).
2. **Deputado** (`/deputados/[slug]`) — cabeçalho com foto, partido e legislatura; três blocos de resumo (proposições, verba usada, "presença: publicada só em PDF"); lista de proposições; gráfico de gastos por mês e por categoria; fonte e data em cada bloco.
3. **Proposições** (`/proposicoes`) — lista com filtro por tipo, ano e autor. Cada item: número, tipo explicado em uma linha, ementa oficial, situação, link para o PLe.
4. **Comparar** (`/comparar`) — escolher de 2 a 4 deputados; mesmas métricas lado a lado, sem ordenar em ranking.
5. **Sobre os dados** (`/dados`) — tabela de fontes, data de cada coleta, o que falta e por quê, como os dados são tratados, como reportar erro.
6. **Sobre** (`/sobre`) — o projeto, o time, ligação com mandatoaberto.org, contato.

Glossário embutido: termos como "indicação", "moção" e "verba indenizatória" ganham explicação de uma linha ao passar o mouse ou tocar.

## 6. Visual

Referência: mandatoaberto.org (observado em 16/11/2026).

- Navegação atual: Deputados, Comparação, Sobre nós.
- Fundo branco com manchas suaves em degradê; títulos grandes em negrito; selo arredondado acima do título ("Transparência Política"); botões arredondados; cartões brancos com borda clara.
- Fonte de sistema sem serifa; raio de borda 0,5rem; componentes no padrão Tailwind + shadcn/ui.
- **O site atual já usa degradê verde → azul** no destaque do título e no botão principal.

Como azul e verde já é a identidade do site nacional, essa combinação não diferenciaria a versão CLDF.

**Proposta (decisão do Claude, a confirmar com mockup):** manter a mesma estrutura e os mesmos componentes, trocando o degradê por verde escuro com detalhe em amarelo-ouro, as cores da bandeira do DF. Alternativa: azul e verde em tons mais escuros que os do site nacional. O Claude Code deve entregar as duas variações na tela inicial para o Yago escolher antes de aplicar no resto.

O aviso "Iniciativa independente. Não é um site oficial da CLDF." fica fixo no topo e no rodapé. Não usar o brasão nem a logomarca da CLDF.

## 7. Como será construído (decisões do Claude)

O Yago não programa e não tem o código do site atual, então estas escolhas são minhas e podem ser revistas pelo time técnico.

- **Do zero**, sem reaproveitar código do Lovable. O site atual serve só de referência visual.
- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**, com páginas geradas de forma estática. Fica rápido, barato e bem indexado; é o encaixe natural com a Vercel.
- **Dados coletados por scripts** (TypeScript, na pasta `scripts/`) que gravam arquivos JSON em `data/`. O site lê esses arquivos; não consulta a CLDF a cada visita.
- **Atualização diária** por GitHub Actions: roda a coleta, grava os JSON, e a Vercel republica. Se a coleta falhar, o site continua no ar com os dados do dia anterior e a data visível.
- **Legislatura como campo de primeira classe** em todos os dados (`legislatura: "2023-2026"`), com seletor na interface escondido enquanto só houver uma.
- **Sem resumos por IA na v1.** Eles exigiriam uma API paga, o que a restrição de custo zero exclui. A linguagem simples vem do glossário, dos rótulos dos tipos de proposição ("Indicação: pedido ao governo para que faça algo") e da ementa oficial. O modelo de dados reserva um campo opcional `resumoSimples` para quando houver verba ou uma opção gratuita validada.
- **Custo zero**: planos gratuitos da Vercel (Hobby) e do GitHub (repositório público, Actions gratuitas), bibliotecas de código aberto.
- **Gráficos** com Recharts, cores acessíveis e tabela equivalente para leitor de tela.
- **Mobile primeiro**: o público prioritário acessa pelo celular.
- **Testes** nos scripts de coleta e transformação (onde erro vira número errado); validação de esquema dos JSON antes de publicar.

## 8. Regras de confiança

- Todo número tem fonte com link e data de coleta.
- Valores em reais vêm direto da fonte; totais calculados dizem como foram calculados.
- Nenhum adjetivo sobre deputados. Nenhum ranking.
- Lacunas são mostradas, não escondidas.
- Link "Encontrou um erro?" em todas as páginas de deputado (e-mail do projeto na v1).

## 9. Ordem de trabalho sugerida

1. Reconhecimento das fontes: chamar a API, baixar os CSVs, documentar os formatos reais em `docs/fontes.md`.
2. Scripts de coleta e arquivos JSON para deputados, proposições e verba.
3. Esqueleto do site com dados reais e sem estilo final.
4. Duas variações de paleta na tela inicial → Yago escolhe.
5. Páginas completas, glossário, página de dados.
6. Automação diária e publicação na Vercel.
7. Depois da v1: experimento de presença 2026 a partir dos PDFs, marcado como experimental e com link para o PDF em cada linha.

## 10. Em aberto

- **Paleta final** — decidir com as duas variações na tela.

Resolvido em 16/11/2026:

- **Contas**: GitHub e Vercel do próprio Yago.
- **Time**: sabe do MVP; a revisão será feita em conjunto.
- **Domínio**: subdomínio `cldf.mandatoaberto.org`. Exige criar um registro DNS (CNAME) no painel de quem administra mandatoaberto.org; até lá, o endereço padrão da Vercel serve.
- **Resumos por IA**: fora da v1 (custo zero).
