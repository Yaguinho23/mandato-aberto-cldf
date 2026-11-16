# Mandato Aberto · CLDF

Site estático com as proposições e a verba indenizatória dos deputados distritais da Câmara Legislativa do DF (legislatura 2023–2026). Cada número tem link para a fonte e a data da coleta.

**Iniciativa independente. Não é um site oficial da CLDF.**

## Como rodar

```bash
npm install
npm run coletar   # baixa os dados públicos e grava em data/
npm run dev       # abre o site em http://localhost:3000
npm test          # roda os testes
```

## Fontes

- Deputados: site da CLDF (`cl.df.gov.br/deputados-2023-2026`) e lista curada em `data/curado/deputados.json`.
- Proposições: sistema PLe da CLDF.
- Verba indenizatória: portal de dados abertos da CLDF (`dados.cl.df.gov.br`).

Formatos, problemas de qualidade encontrados e decisões estão em [docs/fontes.md](docs/fontes.md). Os arquivos de verba em dados abertos podem estar incompletos em relação ao painel oficial; o site rotula a soma como "comprovantes publicados em dados abertos".

## Atualização diária

`.github/workflows/coleta.yml` roda todo dia às 06:17 (Brasília), coleta os dados e faz commit em `data/` só quando há diferença. Se uma fonte falha, os últimos dados bons são mantidos.

## Licença

Código sob licença MIT (ver `LICENSE`). Os dados pertencem às fontes públicas de origem.