import axios from "axios";

// Chave da API para basquete (deve ser configurada nas variáveis de ambiente)
const API_KEY = process.env.API_BASKETBALL_KEY || "";
if (!API_KEY) {
  console.error("❌ API_BASKETBALL_KEY não definida nas variáveis de ambiente!");
}

// Configuração do Axios para a API-Basketball
const api = axios.create({
  baseURL: "https://v1.basketball.api-sports.io",
  headers: {
    "x-rapidapi-key": API_KEY,
    "x-rapidapi-host": "v1.basketball.api-sports.io",
  },
});

// Função para calcular a CDF da distribuição normal (sem alterações)
function normalCdf(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z);
  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

// Função para obter o ID de um time de basquete
async function getTeamId(teamName: string): Promise<number | null> {
  try {
    const response = await api.get("/teams", { params: { search: teamName } });
    if (response.data.results > 0) {
      return response.data.response[0].id;
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar ID para o time ${teamName}:`, error.response?.data || error.message);
    return null;
  }
}

// Função para obter a média de pontos de um time
async function getTeamAveragePoints(teamId: number, leagueId: string, season: string): Promise<number | null> {
  try {
    const response = await api.get("/teams/statistics", {
      params: { team: teamId, league: leagueId, season },
    });
    const stats = response.data.response;
    if (stats && stats.points) {
      return parseFloat(stats.points.for.average.all) || 80; // Retorna 80 como padrão
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar estatísticas para o time ${teamId}:`, error.response?.data || error.message);
    return null;
  }
}

export async function analyzeBasketball(query: string): Promise<string> {
  if (!API_KEY) {
    return "❌ A integração com a API de basquete não está configurada. Contacte o administrador.";
  }

  const parts = query.split(/\bx\b|\bvs\b/i).map((s) => s.trim());
  if (parts.length < 2) {
    return "Formato inválido. Use: TimeA x TimeB";
  }
  const [teamAName, teamBName] = parts;

  // IDs da Liga e Temporada (Ex: NBA 2023-2024)
  const leagueId = "12"; // NBA
  const season = "2023-2024";

  const teamAId = await getTeamId(teamAName);
  const teamBId = await getTeamId(teamBName);

  if (!teamAId || !teamBId) {
    return `❌ Não foi possível encontrar um dos times. Verifique os nomes. Times: ${teamAName}, ${teamBName}`;
  }

  const avgPointsA = await getTeamAveragePoints(teamAId, leagueId, season);
  const avgPointsB = await getTeamAveragePoints(teamBId, leagueId, season);

  if (!avgPointsA || !avgPointsB) {
    return "❌ Não foi possível obter as estatísticas para a análise. Tente mais tarde.";
  }

  const totalExpectedPoints = avgPointsA + avgPointsB;
  const standardDeviation = 12.5; // Desvio padrão é uma suposição estatística
  const lineOverUnder = 215.5; // Linha de aposta comum

  const z = (lineOverUnder - totalExpectedPoints) / standardDeviation;
  const pOver = 1 - normalCdf(z);

  // Montar a resposta
  return (
    `*🏀 ${teamAName} vs ${teamBName}*\n\n` +
    `*Estimativa de Pontos (Baseado em Médias):*\n` +
    `• ${teamAName}: ~${avgPointsA.toFixed(0)} pts\n` +
    `• ${teamBName}: ~${avgPointsB.toFixed(0)} pts\n` +
    `• Total Estimado: *~${totalExpectedPoints.toFixed(0)} pts*\n\n` +
    `*Probabilidade de "Mais de ${lineOverUnder} Pontos":*\n` +
    `• *${(pOver * 100).toFixed(1)}%*\n\n` +
    `_Análise baseada em estatísticas da temporada ${season}._`
  );
}
