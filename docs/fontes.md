# Fontes de dados: formato real

Inspecionadas em 16/11/2026 com requisições reais. Tudo aqui foi observado, não presumido.
As amostras estão em `scripts/__fixtures__/`. **CPFs foram removidos das amostras** e não são guardados em nenhum arquivo do projeto.

Todas as requisições usam `User-Agent: MandatoAbertoCLDF/1.0 (+https://mandatoaberto.org; contato@mandatoaberto.org)` e pelo menos 1 segundo de intervalo por host.

## 1. Proposições: API do PLe

- **URL:** `POST https://ple.cl.df.gov.br/pleservico/api/public/proposicao/filter?page=N&size=M&sort=id,asc`
- **Corpo:** JSON, `Content-Type: application/json`. `{}` devolve tudo (156.466 registros em 16/11/2026).
- **Filtros confirmados:**
  - `{"ano": 2025}`: funciona (4.921 registros). É o filtro usado na coleta, um ano por vez, de 2023 a 2026.
  - `{"tipoProposicao": "Projeto de Lei"}`: funciona com o **nome por extenso** (23.320). Com a sigla `"PL"` devolve zero.
  - `{"autoria": "João Cardoso"}`: funciona (1.059).
- **Paginação:** padrão Spring. Parâmetros `page` (começa em 0) e `size` na URL; `size=2000` foi aceito. Resposta traz `totalElements`, `totalPages`, `last`, `number`. Tamanho padrão: 20.
- **Ordenação:** `sort=id,asc` funciona; sem ele a ordem não é garantida.
- **Codificação:** UTF-8 (o cabeçalho não declara charset; ler os bytes como UTF-8).
- **Licença:** não declarada na API. O portal de dados abertos da CLDF usa CC BY-SA.

### Campos úteis (os demais vêm `null` na listagem pública)

| Campo | Exemplo | Uso |
|---|---|---|
| `id` | `10000` | `Proposicao.id` (como texto) |
| `tipoProposicao` | `"Requerimento"` | nome por extenso → `tipo` |
| `siglaNumeroAno` | `"REQ 14/2023"` | sigla, `numero` e `ano` |
| `ementa` | texto | `ementa` |
| `autoria` | `"Deputado Eduardo Pedrosa, Deputada Dayse Amarilio"` | `autoresTexto` |
| `dataLeitura` | `"2023-02-01"` | `dataApresentacao` (data de leitura em plenário; pode ser `null`) |
| `etapa` | `"Apresentação"`, `"Comissões, Retorno(Parecer)"` | `situacao` |
| `temaNome`, `regiaoAdministrativaNome` | `"#Saúde#"` | não usados na v1 |

`situacaoProposicao`, `autores`, `idAutoria` e `ano` vêm sempre `null` na listagem. A situação disponível é a `etapa`.

### Tipos observados (2025, amostra de 2.000)

| `tipoProposicao` | sigla na fonte | nosso `tipo` |
|---|---|---|
| Projeto de Lei | PL | PL |
| Projeto de Lei Complementar | PLC | PLC |
| Projeto de Decreto Legislativo | PDL | PDL |
| Projeto de Resolução | PR | PR |
| Indicação | IND | IND |
| Moção | MO | MO |
| Requerimento | **REQ** | RQ |
| Proc, Questão de Ordem e qualquer outro | PROC, QO | OUTRO |

### Autoria

- É **texto livre**, não id. Coautores vêm separados por `", "`.
- Deputados vêm com o prefixo `Deputado ` ou `Deputada ` e o nome parlamentar: `Deputado Pepa`, `Deputada Doutora Jane`.
- Pode haver espaço sobrando no fim (`"Deputado João Cardoso "`) e nome repetido (`"Deputado Pepa, Deputado Pepa"`).
- Autores que não são deputados: `Poder Executivo`, `Mesa Diretora`, `Defensoria Pública do Distrito Federal` e comissões. **Nome de comissão pode conter vírgula** (`Comissão de Economia, Orçamento e Finanças`); ao separar por vírgula os pedaços não casam com nenhum deputado e a proposição fica sem atribuição, como deve.
- Registros antigos (2021–2022) citam deputados da legislatura anterior; não casam com ninguém e não são coletados (a coleta começa em 2023).

### URL pública de cada proposição

`https://ple.cl.df.gov.br/#/proposicao/{id}/consultar` (rota do próprio site do PLe).

### Registro de exemplo

```json
{"id":10000,"tipoProposicao":"Requerimento","ementa":"Requer o registro de criação da Frente Parlamentar em Defesa dos Direitos das Pessoas com Autismo.","descricaoProposicao":"14/2023 - Requerimento","siglaNumeroAno":"REQ 14/2023","dataLeitura":"2023-02-01","autoria":"Deputado Eduardo Pedrosa, Deputado Fábio Felix, ...","etapa":"Apresentação"}
```

## 2. Verba indenizatória: portal de dados abertos (CKAN)

- **Catálogo:** `GET https://dados.cl.df.gov.br/api/3/action/package_show?id=verbas-indenizatorias` (API padrão do CKAN). Devolve a lista de arquivos com `name`, `format`, `created`, `url`.
- **Licença:** Creative Commons Atribuição-CompartilhaIgual (CC BY-SA).
- **Granularidade:** uma linha por comprovante (nota fiscal ou recibo), com nome do deputado. Dá para separar por deputado.
- **Padrão de URL:** não há. Cada arquivo tem um id próprio e o nome muda a cada ano; a coleta descobre os arquivos pelo catálogo e escolhe, para cada ano, o arquivo criado mais recentemente cujo nome contém o ano.
- **O rótulo de formato do catálogo não é confiável:** o arquivo de 2026 está marcado como XLSX mas é um CSV. O formato é decidido pelos primeiros bytes (`PK` = XLSX).

### Arquivos da legislatura 2023–2026 (em 16/11/2026)

| Ano | Arquivo | Formato real | Separador | Valor | Data |
|---|---|---|---|---|---|
| 2023 | `verbas-indenizatorias-2023.csv` | CSV UTF-8 | `;` | `500.0` (ponto decimal) | `2023-05-02 00:00:00` |
| 2024 | `2024_verba_indenizatoria.xlsx` (ano inteiro) | XLSX, aba `Sheet0` | n/a | número | data do Excel |
| 2024 | `verbas-indenizatorias-2024.csv` (só até maio; **não usado**) | CSV UTF-8 | `;` | `173,07` | `2024-01-10` |
| 2025 | `verbas-indenizatorias-2025.xlsx` | XLSX, aba `Planilha1` | n/a | número | texto `1/16/2025` **ou** data do Excel |
| 2026 | `ckan_csv_corrigido.csv` (até agosto) | CSV UTF-8 com BOM | `;` | `R$ 5.600,00` | `02/01/2026 00:00` |

### Colunas

2023, 2024 e 2026: `NOME_PARLAMENTAR; CPF_PARLAMENTAR; NOME_PRESTADOR; CNPJ_PRESTADOR; CPF_PRESTADOR; NR_COMPROVANTE; DATA_COMPROVANTE; VALOR_DESPESA; CLASSIFICACAO; OBSERVACOES`. O de 2026 tem uma coluna a mais no início, `ID_REGISTRO`.

2025 usa outros títulos, na mesma ordem: `Nome do(a) Deputado(a); CPF do(a) Deputado(a); Nome do Estabelecimento; CNPJ; CPF; N° do Recibo ou Nota Fiscal; Data do Recibo/NF; Valor; Classificação; Observação`.

### Problemas de qualidade encontrados

1. **Nome do deputado sem padrão.** Aparece como nome parlamentar com prefixo (`Deputado Hermeto`), sem prefixo (`Martins Machado`), em maiúsculas (`CHICO VIGILANTE`), com `Dep.` (`Dep. PEPA`) ou como nome civil completo (`Jane Klébia do Nascimento da Silva`, `Bernardo Rogério Mata de Araújo Júnior`). Resolvido com a lista de `aliases` em `data/curado/deputados.json`; casamento sempre exato.
2. **Linhas sem nome de deputado:** 9 em 2023. São rejeitadas e contadas.
3. **Valores com vírgula como separador de milhar:** `R$ 5,500,00` (5 linhas em 2026). Lidos como 5.500,00, porque os dois últimos dígitos depois do último separador são centavos.
4. **Linha sem valor** (1 em 2026): rejeitada, nunca vira zero.
5. **Datas ambíguas em 2025 e 2026.** O arquivo de 2026 mistura `dia/mês` e `mês/dia` (há `1/20/2026` e há `28/01/2026`) e tem linhas sem data. Quando os dois números são ≤ 12 e diferentes, não dá para saber qual é o mês. No de 2025, parte das datas é texto `mês/dia/ano` e parte é data do Excel, sinal de conversão automática com dia e mês trocados. **Decisão:** o mês só é gravado quando é inequívoco (data ISO, data do Excel de 2024, ou data com um dos números > 12). Nos demais casos `mes` fica `null`: o lançamento entra no total do ano e por categoria, mas não no gráfico mensal, e a página diz quantos lançamentos ficaram sem mês.
6. **Categoria é texto livre de cada gabinete:** `Locação de veículo`, `LOCAÇÃO DE VEICULOS`, `Aluguel de veículo`, `II - Locação de bens móveis...`. **Decisão:** o texto da fonte é mantido; só se tiram espaços sobrando e o numeral romano do início (`VIII - `). Categoria vazia vira `Sem classificação na fonte`. Nada é reagrupado por semelhança.
7. **Nem todos os deputados aparecem.** 2023 tem 21 nomes distintos; 2026 (até agosto) tem 9. Quem não aparece é mostrado como "Nenhum registro publicado no período".
8. **Sem valores negativos** nas amostras, mas o código aceita (glosas e estornos).
9. **Campos com quebra de linha dentro de aspas** (2024 e 2026): o leitor de CSV respeita aspas; contar linhas de texto superestima o número de registros.
10. **Números do Excel com ruído** (`293.79000000000002`): lidos como o mesmo número na forma curta (`293.79`).
11. **Bloco deslocado em 2025.** As 150 linhas de um gabinete vieram sem a coluna `CPF`: recibo, data, valor e classificação estão uma coluna antes do lugar. O leitor reconhece o caso (texto na coluna de valor, valor e data nas vizinhas da esquerda) e lê da coluna certa. 7 dessas linhas não têm data e continuam rejeitadas.

### Conferência da coleta de verba (16/11/2026)

| Ano | Lançamentos | Deputados com registro | Soma | Sem mês confiável |
|---|---|---|---|---|
| 2023 | 1.465 | 19 | R$ 1.958.442,42 | 55 |
| 2024 | 335 | 4 | R$ 593.859,12 | 8 |
| 2025 | 1.078 | 11 | R$ 1.749.824,39 | 969 |
| 2026 (até agosto) | 261 | 10 | R$ 805.484,35 | 142 |

Linhas rejeitadas: 17 (9 sem nome em 2023, 7 do bloco deslocado de 2025 sem data, 1 sem valor em 2026).

**Os dados abertos são incompletos em relação ao painel oficial.** O painel de verba indenizatória da CLDF (Power BI, em `cl.df.gov.br/web/portal-transparencia/verbas-indenizatorias`) mostra, para agosto de 2026, gastos de deputados que não aparecem no arquivo de dados abertos de 2026 (por exemplo João Cardoso, Pepa, Thiago Manzoni e Daniel Donizet). Para quem aparece nos dois, os valores batem linha a linha (Chico Vigilante: locação de veículo de R$ 5.500,00 por mês nos dois), mas o arquivo aberto para de cobrir antes (Chico Vigilante só até abril de 2026).

A conferência exata do total de um deputado em um mês, pedida no plano, **não foi concluída**: o painel não exporta os dados e as datas de 2025 e 2026 no arquivo aberto não permitem fechar um mês. Consequência para o site: a soma é sempre apresentada como "comprovantes publicados em dados abertos", nunca como o total de verba usada, e cada bloco aponta para o painel oficial.

## 3. Relação nominal de deputados e servidores (CKAN)

- **Catálogo:** `GET https://dados.cl.df.gov.br/api/3/action/package_show?id=relacao-nominal-de-deputados-e-servidores`
- Um CSV por mês (o mais recente: `2026-09`, `qdpc202609.csv`). UTF-8, separador `,`.
- **Colunas:** `Matricula,Nome,CargoEfetivo,CategoriaEfetivo,CargoFuncao,Lotacao,Admissao,Aposentadoria,Desligamento,CargaHorariaDiaria`
- Os deputados são as linhas com `CargoFuncao = DEPUTADO DISTRITAL` (24 em setembro de 2026).
- `Nome` é o **nome civil em maiúsculas e sem acento** (`FRANCISCO DOMINGOS DOS SANTOS`); o nome parlamentar aparece em `Lotacao` (`GABINETE DO DEPUTADO CHICO VIGILANTE`).
- Sem partido e sem foto. Serve para conferir a lista curada e como fonte dos nomes civis usados nos `aliases`.
- A amostra guarda só os 24 deputados e 5 linhas de servidores com nome trocado.

Exemplo: `67,FRANCISCO DOMINGOS DOS SANTOS,,,DEPUTADO DISTRITAL,GABINETE DO DEPUTADO CHICO VIGILANTE,2003-01-01,,,8`

## 4. Lista de deputados com partido e foto

- **URL:** `https://www.cl.df.gov.br/deputados-2023-2026` (página "Legislatura atual"; `https://www.cl.df.gov.br/deputados` redireciona para ela).
- HTML com 24 cartões: nome parlamentar, partido por extenso com sigla, foto e link do perfil. Extraídos em `scripts/__fixtures__/deputados-pagina-oficial.json`.
- Usada uma única vez para montar `data/curado/deputados.json`, que é mantido à mão. A coleta diária não lê esta página.

## 5. Outros endpoints do PLe (referência para depois da v1; não implementados)

O repositório `github.com/maximusminus/relatorio-cldf` não publica o código de coleta, só os dados derivados (`dados/votacoes.csv`, `sessoes.csv`, `emendas.csv`) e a indicação da base `ple.cl.df.gov.br/pleservico/api/public`. O código do próprio site do PLe referencia estes caminhos públicos, além de `public/proposicao`:

`public/historico-proposicao`, `public/reuniao`, `public/documentos-reuniao`, `public/proposicao/documento`, `public/tipo-proposicao`, `public/tipo-documento`, `public/autor`, `public/tema`, `public/regiao-administrativa`, `public/orgao-legislativo`, `public/unidade`, `public/norma`.

Nenhum deles foi chamado. `public/reuniao` e `public/documentos-reuniao` são o ponto de partida para o experimento de presença.

Também existe no portal de dados abertos um conjunto `emendas-parlamentares`, não inspecionado (emendas estão fora da v1).

## 6. Portão da Task 1

- A API devolve autoria? **Sim**, em texto.
- A verba separa por deputado? **Sim**, por comprovante.

O escopo segue como planejado, com as ressalvas dos itens 5 e 6 da seção de verba.

## 7. Conferência da coleta de proposições (16/11/2026)

Primeira coleta real, 2023 a 2026: **19.910 proposições** (2023: 6.903; 2024: 4.931; 2025: 4.921; 2026: 3.155).
Por tipo: IND 11.237, RQ 3.130, PL 2.527, MO 2.213, PDL 505, PLC 117, PR 92, OUTRO 89.

**Sem autor reconhecido: 647 (3,2%)**, abaixo do limite de 15% do plano. São autores que não são deputados da legislatura: Poder Executivo (455), comissões, Mesa Diretora (34), Defensoria Pública (14), Tribunal de Contas (13), uma Sugestão Legislativa, um registro sem autoria e um de "Deputado Rafael Prudente", que não está entre os 24 em exercício. Nenhum alias precisou ser acrescentado.

## Comissões e frentes parlamentares

- **Comissões permanentes** (`https://www.cl.df.gov.br/comissoes-permanentes`): a página embute a lista completa de composições em um literal JavaScript (`var composicoesFlat=[...]`, chaves sem aspas, escapes `\xNN`). O coletor lê esse literal sem executá-lo. Composição atual = registros sem `dataFim`. Cada composição tem 5 membros (Presidente, Vice-Presidente, Membro) com suplente. Há registros históricos (`CES`, `CESC`, `CDDHCEDP`, `CPDM`) com data de fim; são ignorados.
- **Comissões temporárias**: a página não traz composição legível; fora da v1.
- **Frentes parlamentares** (`https://www.cl.df.gov.br/frentes-parlamentares`): tabela HTML (155 frentes em 16/11/2026) com requerimento (link do PLe), nome, autor (1º signatário) e signatários separados por `<br>`. Os nomes vêm em grafias variadas (`João Hermeto`, `Paulo Belmonte`, `João Cardoso Professor Auditor`, `Roosevelt`, `Jorge Viana`); estas foram adicionadas como aliases em `data/curado/deputados.json`. Duas entradas continuam sem correspondência exata (`Ricardo Vale e Gabriel Magno`, `Doutora Jorge Vianna`) e aparecem como texto original na página, sem adivinhar.