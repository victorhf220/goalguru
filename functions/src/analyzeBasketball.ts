function normalCdf(z: number): number {
  // Aproximação da CDF normal padrão usando a função erro
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z);

  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-z * z);

  return 0.5 * (1 + sign * y);
}

interface TeamStats {
  name: string;
  offRating: number;
  defRating: number;
}

// Simulação de busca de stats (em produção, usar BallDontLie API)
async function getTeamStats(teamName: string): Promise<TeamStats> {
  // Exemplo simplificado: usar dados hardcoded ou chamar API
  // Em produção: https://api.balldontlie.io/v1/teams?search=...
  
  const teamData: Record<string, TeamStats> = {
    "lakers": { name: "Los Angeles Lakers", offRating: 115.2, defRating: 112.1 },
    "celtics": { name: "Boston Celtics", offRating: 118.5, defRating: 110.3 },
    "warriors": { name: "Golden State Warriors", offRating: 116.8, defRating: 111.4 },
    "heat": { name: "Miami Heat", offRating: 112.3, defRating: 108.9 },
    "denver": { name: "Denver Nuggets", offRating: 119.2, defRating: 113.5 }
  };

  const key = teamName.toLowerCase();
  if (teamData[key]) {
    return teamData[key];
  }

  // Fallback para médias gerais da NBA
  return {
    name: teamName,
    offRating: 113.5,
    defRating: 111.2
  };
}

export async function analyzeBasketball(query: string): Promise<string> {
  // Parsear: "Lakers x Celtics" ou "Lakers vs Celtics"
  const parts = query
    .split(/\bx\b|\bvs\b|vs\.?/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length < 2) {
    throw new Error("Formato inválido. Use: TimeA x TimeB");
  }

  const teamAName = parts[0];
  const teamBName = parts[1];

  console.log(`Analisando basquete: ${teamAName} x ${teamBName}`);

  const teamA = await getTeamStats(teamAName);
  const teamB = await getTeamStats(teamBName);

  // Estimar pontos esperados
  // Fórmula simplificada: (offRating + defRating oposto) / 2
  const expectedA = (teamA.offRating + teamB.defRating) / 2;
  const expectedB = (teamB.offRating + teamA.defRating) / 2;
  const totalExpected = expectedA + expectedB;

  // Desvio padrão aproximado (típico para NBA: ~12-13 pontos)
  const sd = 12.5;

  // Probabilidades para alguns thresholds comuns
  const thresholds = [210, 215, 220, 225];
  const overProbs: Record<number, number> = {};

  for (const threshold of thresholds) {
    const z = (threshold - totalExpected) / sd;
    overProbs[threshold] = 1 - normalCdf(z);
  }

  // Score mais provável para cada time (distribuição normal)
  // const probA = Math.exp(-Math.pow(expectedA - Math.round(expectedA), 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

  // Criar mensagem
  const text =
    `*🏀 Análise — ${teamA.name} x ${teamB.name}*\n\n` +
    `*Estimativa de Placar:*\n` +
    `• ${teamA.name}: ${expectedA.toFixed(1)} pts (Rating: ${teamA.offRating.toFixed(1)})\n` +
    `• ${teamB.name}: ${expectedB.toFixed(1)} pts (Rating: ${teamB.offRating.toFixed(1)})\n` +
    `• *Total esperado: ${totalExpected.toFixed(1)} pts*\n\n` +
    `*Mercados de Total:*\n` +
    `• Over 210: ${(overProbs[210] * 100).toFixed(1)}%\n` +
    `• Over 215: ${(overProbs[215] * 100).toFixed(1)}%\n` +
    `• Over 220: ${(overProbs[220] * 100).toFixed(1)}%\n` +
    `• Over 225: ${(overProbs[225] * 100).toFixed(1)}%\n\n` +
    `*Diferença esperada:*\n` +
    `• Spread: ${(expectedA - expectedB).toFixed(1)} pts\n\n` +
    `_⚠️ Análise baseada em ratings; confirme lesões e ritmo de jogo._`;

  return text;
}
