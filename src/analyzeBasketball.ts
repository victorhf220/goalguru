function normalCdf(z: number): number {
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

export async function analyzeBasketball(query: string): Promise<string> {
  const parts = query
    .split(/\bx\b|\bvs\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length < 2) {
    throw new Error("Formato: TimeA x TimeB");
  }

  const teamA = parts[0];
  const teamB = parts[1];

  // Simulando dados
  const expectedA = 110;
  const expectedB = 108;
  const total = expectedA + expectedB;
  const sd = 12.5;

  const z = (215 - total) / sd;
  const pOver = 1 - normalCdf(z);

  return (
    `*🏀 ${teamA} x ${teamB}*\n\n` +
    `*Estimativa:*\n` +
    `• ${teamA}: ${expectedA} pts\n` +
    `• ${teamB}: ${expectedB} pts\n` +
    `• Total: ${total} pts\n\n` +
    `*Over 215: ${(pOver * 100).toFixed(1)}%*\n` +
    `_Análise estatística_`
  );
}
