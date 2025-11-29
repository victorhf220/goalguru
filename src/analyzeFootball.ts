import axios from "axios";

// A chave da API para football-data.org
const API_KEY = process.env.API_FOOTBALL_KEY || "";
if (!API_KEY) {
  console.error("❌ API_FOOTBALL_KEY não definida para football-data.org!");
}

// Configuração do Axios para a API football-data.org
const api = axios.create({
  baseURL: "https://api.football-data.org/v4",
  headers: {
    "X-Auth-Token": API_KEY,
  },
});

// Função de Poisson e Fatorial (sem alterações)
function poisson(k: number, lambda: number): number {
  if (lambda <= 0) return 0;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function factorial(n: number): number {
  if (n < 0) return 0;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// Interface para as estatísticas que vamos extrair
interface TeamStats {
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

// Função para obter estatísticas dos times de uma liga
async function getLeagueStandings(leagueCode: string): Promise<Map<string, TeamStats> | null> {
  try {
    const response = await api.get(`/competitions/${leagueCode}/standings`);
    const standings = response.data.standings[0]?.table;

    if (!standings) return null;

    const teamStatsMap = new Map<string, TeamStats>();

    for (const item of standings) {
      const { team, playedGames, goalsFor, goalsAgainst } = item;
      if (playedGames > 0) {
        teamStatsMap.set(team.name, {
          avgGoalsFor: goalsFor / playedGames,
          avgGoalsAgainst: goalsAgainst / playedGames,
        });
      }
    }
    return teamStatsMap;
  } catch (error) {
    console.error(`Erro ao buscar classificação da liga ${leagueCode}:`, error.response?.data || error.message);
    return null;
  }
}

// Função para encontrar a melhor correspondência de nome de time
function findBestTeamMatch(teamName: string, statsMap: Map<string, TeamStats>): { name: string; stats: TeamStats } | null {
    // Tentativa 1: Correspondência exata (ignorando maiúsculas/minúsculas)
    for (const [name, stats] of statsMap.entries()) {
        if (name.toLowerCase() === teamName.toLowerCase()) {
            return { name, stats };
        }
    }

    // Tentativa 2: Correspondência parcial (verifica se o nome no mapa contém o nome pesquisado)
    for (const [name, stats] of statsMap.entries()) {
        if (name.toLowerCase().includes(teamName.toLowerCase())) {
            return { name, stats };
        }
    }
    
    return null;
}

export async function analyzeFootball(query: string): Promise<string> {
  if (!API_KEY) {
    return "❌ A integração com a API de futebol (football-data.org) não está configurada.";
  }

  const parts = query.split(/\bx\b|\bvs\b/i).map((s) => s.trim());
  if (parts.length < 2) {
    return "Formato inválido. Use: TimeA x TimeB";
  }
  const [teamAName, teamBName] = parts;

  // Código da competição (BSA para Brasileirão Série A)
  const leagueCode = "BSA"; 
  const season = new Date().getFullYear();

  const statsMap = await getLeagueStandings(leagueCode);
  if (!statsMap) {
    return "❌ Não foi possível obter as estatísticas da liga. A API pode estar indisponível.";
  }

  const matchA = findBestTeamMatch(teamAName, statsMap);
  const matchB = findBestTeamMatch(teamBName, statsMap);

  if (!matchA || !matchB) {
    let errorMsg = "❌ Não foi possível encontrar os times na liga. Verifique os nomes:";
    if (!matchA) errorMsg += `\n- ${teamAName}`;
    if (!matchB) errorMsg += `\n- ${teamBName}`;
    return errorMsg;
  }

  const { name: officialNameA, stats: statsA } = matchA;
  const { name: officialNameB, stats: statsB } = matchB;

  // Lambdas com base na força de ataque vs. defesa
  const lambdaA = statsA.avgGoalsFor * statsB.avgGoalsAgainst;
  const lambdaB = statsB.avgGoalsFor * statsA.avgGoalsAgainst;

  // Cálculo das probabilidades
  let pAwin = 0, pDraw = 0, pBwin = 0, pOver25 = 0;
  const maxGoals = 6;

  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      const prob = poisson(i, lambdaA) * poisson(j, lambdaB);
      if (i > j) pAwin += prob;
      else if (i === j) pDraw += prob;
      else pBwin += prob;
      if (i + j > 2.5) pOver25 += prob;
    }
  }

  const totalProb = pAwin + pDraw + pBwin;
  if (totalProb === 0) return "Análise inconclusiva devido a dados insuficientes.";
  
  // Normalizar
  pAwin /= totalProb;
  pDraw /= totalProb;
  pBwin /= totalProb;

  // Resposta
  return (
    `*⚽ ${officialNameA} vs ${officialNameB}*\n\n` +
    `*Probabilidades (Modelo de Poisson):*\n` +
    `• Vitória ${officialNameA}: *${(pAwin * 100).toFixed(1)}%*\n` +
    `• Empate: *${(pDraw * 100).toFixed(1)}%*\n` +
    `• Vitória ${officialNameB}: *${(pBwin * 100).toFixed(1)}%*\n\n` +
    `*Mercados Populares:*\n` +
    `• Mais de 2.5 Gols: *${(pOver25 * 100).toFixed(1)}%*\n\n` +
    `_Análise baseada em estatísticas da liga ${leagueCode} na temporada ${season}._`
  );
}
