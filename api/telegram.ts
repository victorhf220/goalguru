import { VercelRequest, VercelResponse } from "@vercel/node";
import TelegramBot from "node-telegram-bot-api";
import { setupTelegramHandlers } from "../src/telegram";

let bot: any | null = null;

async function initializeBot() {
  if (bot) return bot;
  
  const token = process.env.TELEGRAM_TOKEN || process.env.telegram_token;
  
  console.log("🔍 Procurando token...", {
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN ? "SET" : "NOT_SET",
    telegram_token: process.env.telegram_token ? "SET" : "NOT_SET",
    finalToken: token ? "FOUND" : "NOT_FOUND"
  });

  if (!token) {
    console.error("❌ TELEGRAM_TOKEN não configurado em env vars!");
    console.error("❌ Por favor, adicione TELEGRAM_TOKEN no Vercel Project Settings → Environment Variables");
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: false });
    await setupTelegramHandlers(bot);
    console.log("✅ Bot Telegram inicializado com token:", token.substring(0, 10) + "...");
    return bot;
  } catch (err) {
    console.error("❌ Erro ao inicializar bot:", err);
    return null;
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // GET para health check
    if (req.method === "GET") {
      return res.status(200).json({ 
        status: "ok",
        bot: bot ? "initialized" : "not initialized"
      });
    }

    // Inicializar bot se necessário
    const telegramBot: any = await initializeBot();
    if (!telegramBot) {
      return res.status(500).json({ error: "Bot not initialized" });
    }

    // POST - Processar update do Telegram
    const update = req.body;
    
    if (!update.update_id) {
      return res.status(400).json({ error: "Invalid update" });
    }

    console.log("📩 Update recebido:", {
      update_id: update.update_id,
      text: update.message?.text || update.callback_query?.data || "sem texto"
    });

    // Processar o update
    await telegramBot.processUpdate(update);
    
    res.status(200).json({ 
      ok: true, 
      message: "Update processado"
    });
  } catch (err: any) {
    console.error("❌ Erro no webhook Telegram:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
};

