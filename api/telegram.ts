import { VercelRequest, VercelResponse } from "@vercel/node";
import TelegramBot from "node-telegram-bot-api";
import { connectDB } from "../src/db";
import { setupTelegramHandlers } from "../src/telegram";

let bot: TelegramBot | null = null;

async function initializeBot() {
  if (bot) return;
  
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.error("❌ TELEGRAM_TOKEN não configurado!");
    return;
  }

  bot = new TelegramBot(token, { polling: false });
  await setupTelegramHandlers(bot);
  console.log("✅ Bot Telegram inicializado");
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Inicializar bot
    await initializeBot();
    
    if (!bot) {
      return res.status(500).json({ error: "Bot not initialized" });
    }

    // Processar update do Telegram
    const update = req.body;
    console.log("📩 Update recebido:", update.message?.text || update.callback_query?.data);

    await bot.processUpdate(update);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook Telegram:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
