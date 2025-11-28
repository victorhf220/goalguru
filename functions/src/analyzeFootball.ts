import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const BASE = "https://v3.football.api-sports.io";

function poisson(k: number, lambda: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

interface TeamStats {
  name: string;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

async function getTeamStats(teamName: string): Promise<TeamStats | null> {
  try {
    // Buscar ID do time
    const searchRes = await axios.get(`${BASE}/teams`, {
      params: { name: teamName },
      headers: { "X-RapidAPI-Key": API_KEY }
    });

    if (!searchRes.data.response || searchRes.data.response.length === 0) {
      return null;
    }

    const team = searchRes.data.response[0];
    const teamId = team.team.id;

    // Buscar estatísticas recentes
    const statsRes = await axios.get(`${BASE}/teams/statistics`, {
      params: { team: teamId, season: new Date().getFullYear() },
      headers: { "X-RapidAPI-Key": API_KEY }
    });

    const stats = statsRes.data.response;
    if (!stats) {
      // fallback para médias gerais
      return {
        name: team.team.name,
        avgGoalsFor: 1.5,
        avgGoalsAgainst: 1.2
      };
    }

    return {
      name: team.team.name,
      avgGoalsFor: stats.goals?.for?.average?.total || 1.5,
      avgGoalsAgainst: stats.goals?.against?.average?.total || 1.2
    };
  } catch (err) {
    console.error(`Erro ao buscar stats para ${teamName}:`, err);
    // retornar médias padrão em caso de erro
    return {
      name: teamName,
      avgGoalsFor: 1.5,
      avgGoalsAgainst: 1.2
    };
  }
}

export async function analyzeFootball(query: string): Promise<string> {
  // Parsear: "Corinthians x Palmeiras" ou "Corinthians vs Palmeiras"
  const parts = query
    .split(/\bx\b|\bvs\b|vs\.?/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length < 2) {
    throw new Error("Formato inválido. Use: TimeA x TimeB");
  }

  const teamAName = parts[0];
  const teamBName = parts[1];

  console.log(`Analisando: ${teamAName} x ${teamBName}`);

  const teamAStats = await getTeamStats(teamAName);
  const teamBStats = await getTeamStats(teamBName);

  if (!teamAStats || !teamBStats) {
    throw new Error("Não consegui encontrar estatísticas para um dos times.");
  }

  const lambdaA = teamAStats.avgGoalsFor;
  const lambdaB = teamBStats.avgGoalsFor;

  // Calcular probabilidades de score usando Poisson
  const probs: number[][] = [];
  for (let i = 0; i <= 5; i++) {
    probs[i] = [];
    for (let j = 0; j <= 5; j++) {
      probs[i][j] = poisson(i, lambdaA) * poisson(j, lambdaB);
    }
  }

  // Calcular probabilidades de resultado
  let pAwin = 0,
    pDraw = 0,
    pBwin = 0;
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      if (i > j) pAwin += probs[i][j];
      else if (i === j) pDraw += probs[i][j];
      else pBwin += probs[i][j];
    }
  }

  // Over 2.5
  let pOver25 = 0;
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      if (i + j > 2.5) pOver25 += probs[i][j];
    }
  }

  // BTTS (Ambos marcam)
  let pBtts = 0;
  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 5; j++) {
      pBtts += probs[i][j];
    }
  }

  // Score mais provável
  let maxProb = 0,
    bestScore = "1-1";
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      if (probs[i][j] > maxProb) {
        maxProb = probs[i][j];
        bestScore = `${i}-${j}`;
      }
    }
  }

  const text =
    `*📊 Análise — ${teamAStats.name} x ${teamBStats.name}*\n\n` +
    `*Probabilidades de Resultado:*\n` +
    `• Vitória ${teamAStats.name}: ${(pAwin * 100).toFixed(1)}%\n` +
    `• Empate: ${(pDraw * 100).toFixed(1)}%\n` +
    `• Vitória ${teamBStats.name}: ${(pBwin * 100).toFixed(1)}%\n\n` +
    `*Mercados Principais:*\n` +
    `• Score mais provável: ${bestScore} (${(maxProb * 100).toFixed(2)}%)\n` +
    `• Over 2.5 gols: ${(pOver25 * 100).toFixed(1)}%\n` +
    `• Ambos marcam (BTTS): ${(pBtts * 100).toFixed(1)}%\n\n` +
    `*Médias esperadas:*\n` +
    `• ${teamAStats.name}: ${lambdaA.toFixed(2)} gols\n` +
    `• ${teamBStats.name}: ${lambdaB.toFixed(2)} gols\n\n` +
    `_⚠️ Análise estatística; confirme escalações e odds antes de apostar._`;

  return text;
}
