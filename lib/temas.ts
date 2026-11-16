// Temas por palavras na ementa. Regra simples e pública, sem IA: a ementa é normalizada
// (sem acento, minúscula) e comparada com o início de cada palavra-chave.
// Palavra-chave terminada em "!" só vale como palavra inteira (ex.: "sus!").
export interface Tema {
  id: string;
  nome: string;
  palavras: string[];
}

export const TEMAS: Tema[] = [
  { id: "mobilidade", nome: "Mobilidade e trânsito", palavras: ["transporte", "transito", "onibus", "metro!", "mobilidade", "ciclovia", "ciclista", "bicicleta", "rodovia", "trafego", "estacionamento", "motocicleta", "motorista", "tarifa", "brt!", "passageiro", "veiculo", "calcada"] },
  { id: "seguranca", nome: "Segurança pública", palavras: ["seguranca publica", "policia", "policial", "policiamento", "violencia", "criminalidade", "crime", "delegacia", "bombeiro", "presidio", "penitenciar", "furto", "roubo", "vitima", "agente de seguranca"] },
  { id: "saude", nome: "Saúde", palavras: ["saude", "hospital", "medic", "sus!", "vacina", "ubs!", "doenca", "paciente", "enfermagem", "farmac", "cancer", "sanitaria", "ambulatori", "cirurgia", "tratamento"] },
  { id: "educacao", nome: "Educação", palavras: ["educacao", "escola", "ensino", "aluno", "estudante", "professor", "creche", "universidade", "alfabetizacao", "pedagog"] },
  { id: "meio-ambiente", nome: "Meio ambiente e saneamento", palavras: ["meio ambiente", "ambiental", "arvore", "residuos", "reciclagem", "lixo", "saneamento", "desmatamento", "poluicao", "area verde", "parque", "sustentab"] },
  { id: "mulheres-criancas-idosos", nome: "Mulheres, crianças e idosos", palavras: ["mulher", "mulheres", "crianca", "adolescente", "idoso", "idosa", "gestante", "maternidade", "violencia domestica", "feminin"] },
  { id: "deficiencia", nome: "Pessoas com deficiência", palavras: ["deficiencia", "autis", "acessibilidade", "pcd!", "cadeirante", "libras"] },
  { id: "economia-trabalho", nome: "Economia e trabalho", palavras: ["economia", "emprego", "trabalhador", "trabalhista", "empresa", "empreendedor", "imposto", "tributo", "tributar", "icms", "comercio", "renda", "servidor"] },
  { id: "habitacao-urbanismo", nome: "Habitação e urbanismo", palavras: ["habitacao", "habitacional", "moradia", "regularizacao", "fundiari", "urbanis", "uso do solo", "territorial", "obra"] },
  { id: "cultura-esporte", nome: "Cultura, esporte e lazer", palavras: ["cultura", "cultural", "esporte", "esportiv", "lazer", "artista", "patrimonio", "turismo", "festival", "atleta"] },
  { id: "animais", nome: "Proteção animal", palavras: ["animal", "animais", "pet!", "pets!", "veterinari", "maus-tratos", "maus tratos"] },
];

const simplificar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const REGRAS = TEMAS.map((t) => ({
  id: t.id,
  regex: new RegExp(t.palavras.map((p) => (p.endsWith("!") ? `\\b${escapar(p.slice(0, -1))}\\b` : `\\b${escapar(p)}`)).join("|")),
}));

/** Ids dos temas cujas palavras aparecem na ementa. Pode ser vazio ou ter vários. */
export function temasDe(ementa: string): string[] {
  const texto = simplificar(ementa);
  return REGRAS.filter((r) => r.regex.test(texto)).map((r) => r.id);
}

export const nomeDoTema = (id: string) => TEMAS.find((t) => t.id === id)?.nome ?? id;