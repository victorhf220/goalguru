import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { setupTelegramHandlers } from "./src/telegram";
import { setupDashboard } from "./src/dashboard";
import { connectDB } from "./src/db";

// Version: 1.4.0 - Simplify bot flow with inline keyboards
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Bypass Vercel deployment protection for public endpoints
const bypassProtectionToken = process.env.VERCEL_PROTECTION_BYPASS;
if (bypassProtectionToken) {
  app.use((req: Request, res: Response, next) => {
    res.setHeader('x-vercel-protection-bypass', bypassProtectionToken);
    next();
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB().catch((err) => {
  console.error("Erro ao conectar ao MongoDB:", err);
  process.exit(1);
});

// Initialize Telegram Bot
let bot: any | null = null;

async function initializeBot() {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.error("❌ TELEGRAM_TOKEN não configurado!");
    return;
  }

  bot = new TelegramBot(token, { polling: false });
  await setupTelegramHandlers(bot);
  console.log("✅ Bot Telegram inicializado");
}

// Webhook endpoint for Telegram
app.post("/api/telegram", async (req: Request, res: Response) => {
  try {
    if (!bot) {
      return res.status(500).send("Bot not initialized");
    }

    const update = req.body;
    console.log("📩 Update recebido:", update.message?.text || update.callback_query?.data);

    await bot.processUpdate(update);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Erro no webhook Telegram:", err);
    res.status(500).send("ERR");
  }
});

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", bot: bot ? "initialized" : "not initialized" });
});

// Register webhook (endpoint for manual setup)
app.post("/api/register-webhook", async (req: Request, res: Response) => {
  try {
    if (!bot) {
      return res.status(500).json({ error: "Bot not initialized" });
    }

    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.VERCEL_URL || "https://seu-dominio.vercel.app"}/api/telegram`;
    
    if (!webhookUrl || webhookUrl.includes("seu-dominio")) {
      return res.status(400).json({ 
        error: "WEBHOOK_URL not configured",
        hint: "Configure a variável WEBHOOK_URL no Vercel"
      });
    }

    await bot.setWebHook(webhookUrl);
    console.log(`✅ Webhook registrado: ${webhookUrl}`);
    res.status(200).json({ 
      success: true, 
      webhook_url: webhookUrl,
      message: "Webhook registrado com sucesso! 🎉"
    });
  } catch (err: any) {
    console.error("Erro ao registrar webhook:", err);
    res.status(500).json({ error: err.message });
  }
});

// Setup inicial (sem proteção)
app.get("/setup", async (req: Request, res: Response) => {
  try {
    if (!bot) {
      return res.status(500).send("Bot not initialized");
    }

    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.VERCEL_URL || "https://seu-dominio.vercel.app"}/api/telegram`;
    await bot.setWebHook(webhookUrl);
    
    res.send(`<h1>✅ Webhook registrado!</h1><p>URL: ${webhookUrl}</p>`);
  } catch (err: any) {
    res.send(`<h1>❌ Erro</h1><p>${err.message}</p>`);
  }
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("🤖 GoalGuru Bot - Running on Vercel");
});

// Initialize bot and start server
initializeBot().then(() => {
  // Setup dashboard
  setupDashboard(app);

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Webhook esperado em: ${process.env.WEBHOOK_URL || "http://localhost:" + PORT}/api/telegram`);
    console.log(`📊 Dashboard em: http://localhost:${PORT}/dashboard?token=admin123`);
  });
});

export default app;
