import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY || "";

function poisson(k: number, lambda: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export async function analyzeFootball(query: string): Promise<string> {
  const parts = query
    .split(/\bx\b|\bvs\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length < 2) {
    throw new Error("Formato: TimeA x TimeB");
  }

  const teamA = parts[0];
  const teamB = parts[1];

  // Simulando dados (em produção, chamar API-Football)
  const lambdaA = 1.5;
  const lambdaB = 1.3;

  let pAwin = 0, pDraw = 0, pBwin = 0, pOver25 = 0;
  const probs: number[][] = [];

  for (let i = 0; i <= 5; i++) {
    probs[i] = [];
    for (let j = 0; j <= 5; j++) {
      probs[i][j] = poisson(i, lambdaA) * poisson(j, lambdaB);
      if (i > j) pAwin += probs[i][j];
      else if (i === j) pDraw += probs[i][j];
      else pBwin += probs[i][j];
      if (i + j > 2.5) pOver25 += probs[i][j];
    }
  }

  return (
    `*⚽ ${teamA} x ${teamB}*\n\n` +
    `*Probabilidades:*\n` +
    `• Vitória ${teamA}: ${(pAwin * 100).toFixed(1)}%\n` +
    `• Empate: ${(pDraw * 100).toFixed(1)}%\n` +
    `• Vitória ${teamB}: ${(pBwin * 100).toFixed(1)}%\n\n` +
    `*Mercados:*\n` +
    `• Over 2.5: ${(pOver25 * 100).toFixed(1)}%\n` +
    `_Análise estatística_`
  );
}
