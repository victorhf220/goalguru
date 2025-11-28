import express, { Request, Response } from "express";
import { User, Analysis, Payment } from "./db";

export async function setupDashboard(app: express.Application) {
  // Middleware simples de autenticação
  const dashboardAuth = (req: Request, res: Response, next: Function) => {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const token = req.query.token || req.headers["authorization"]?.split(" ")[1];
    
    if (token !== adminPassword) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Dashboard HTML
  app.get("/dashboard", dashboardAuth, async (req: Request, res: Response) => {
    try {
      const totalUsers = await User.countDocuments();
      const vipUsers = await User.countDocuments({ vip: true });
      const totalAnalyses = await Analysis.countDocuments();
      const totalPayments = await Payment.countDocuments({ status: "confirmed" });
      
      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
      const recentAnalyses = await Analysis.find().sort({ createdAt: -1 }).limit(10);

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🤖 GoalGuru - Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }

    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    header p {
      font-size: 1.1em;
      opacity: 0.9;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
    }

    .stat-icon {
      font-size: 1.5em;
      margin-right: 10px;
    }

    .section {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .section h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 1.5em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      background: #f5f5f5;
      padding: 15px;
      text-align: left;
      color: #333;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }

    td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }

    tr:hover {
      background: #f9f9f9;
    }

    .badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .badge-vip {
      background: #ffd700;
      color: #333;
    }

    .badge-regular {
      background: #e0e0e0;
      color: #333;
    }

    .badge-football {
      background: #4CAF50;
      color: white;
    }

    .badge-basketball {
      background: #2196F3;
      color: white;
    }

    .info-box {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .info-box p {
      color: #666;
      line-height: 1.6;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-state p {
      font-size: 1.1em;
    }

    footer {
      text-align: center;
      color: white;
      margin-top: 40px;
      padding: 20px 0;
    }

    @media (max-width: 768px) {
      header h1 {
        font-size: 1.8em;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      table {
        font-size: 0.9em;
      }

      th, td {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 GoalGuru Dashboard</h1>
      <p>Panel de controle do seu bot Telegram</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">👥 Total de Usuários</div>
        <div class="stat-value">${totalUsers}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">⭐ Usuários VIP</div>
        <div class="stat-value">${vipUsers}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📊 Análises Realizadas</div>
        <div class="stat-value">${totalAnalyses}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">💰 Pagamentos Confirmados</div>
        <div class="stat-value">${totalPayments}</div>
      </div>
    </div>

    <div class="section">
      <h2>📋 Usuários Recentes</h2>
      ${recentUsers.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telegram ID</th>
              <th>Status</th>
              <th>Créditos</th>
              <th>Data de Cadastro</th>
            </tr>
          </thead>
          <tbody>
            ${recentUsers.map(user => `
              <tr>
                <td>${user.firstName} ${user.lastName || ""}</td>
                <td><code>${user.telegramId}</code></td>
                <td>
                  <span class="badge ${user.vip ? "badge-vip" : "badge-regular"}">
                    ${user.vip ? "⭐ VIP" : "Regular"}
                  </span>
                </td>
                <td>${user.credits}</td>
                <td>${new Date(user.createdAt).toLocaleDateString("pt-BR")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `
        <div class="empty-state">
          <p>Nenhum usuário cadastrado ainda</p>
        </div>
      `}
    </div>

    <div class="section">
      <h2>📊 Análises Recentes</h2>
      ${recentAnalyses.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Consulta</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${recentAnalyses.map(analysis => `
              <tr>
                <td>
                  <span class="badge ${analysis.type === "futebol" ? "badge-football" : "badge-basketball"}">
                    ${analysis.type === "futebol" ? "⚽ Futebol" : "🏀 Basquete"}
                  </span>
                </td>
                <td>${analysis.query}</td>
                <td>${new Date(analysis.createdAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                })}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `
        <div class="empty-state">
          <p>Nenhuma análise realizada ainda</p>
        </div>
      `}
    </div>

    <div class="info-box">
      <p>
        <strong>💡 Dica:</strong> Para acessar o dashboard, acrescente <code>?token=sua_senha_admin</code> à URL.
        Você pode alterar a senha configurando a variável <code>ADMIN_PASSWORD</code> no Vercel.
      </p>
    </div>

    <footer>
      <p>🚀 GoalGuru © 2025 | Telegram Analytics Bot</p>
    </footer>
  </div>
</body>
</html>
      `;

      res.send(html);
    } catch (err: any) {
      res.status(500).send(`<h1>❌ Erro</h1><p>${err.message}</p>`);
    }
  });

  // API - Dados em JSON
  app.get("/api/dashboard/stats", dashboardAuth, async (req: Request, res: Response) => {
    try {
      const totalUsers = await User.countDocuments();
      const vipUsers = await User.countDocuments({ vip: true });
      const totalAnalyses = await Analysis.countDocuments();
      const totalPayments = await Payment.countDocuments({ status: "confirmed" });

      res.json({
        totalUsers,
        vipUsers,
        totalAnalyses,
        totalPayments,
        timestamp: new Date()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API - Usuários
  app.get("/api/dashboard/users", dashboardAuth, async (req: Request, res: Response) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API - Análises
  app.get("/api/dashboard/analyses", dashboardAuth, async (req: Request, res: Response) => {
    try {
      const analyses = await Analysis.find().sort({ createdAt: -1 });
      res.json(analyses);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
