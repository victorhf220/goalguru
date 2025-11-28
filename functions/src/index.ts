import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { setupTelegramHandlers } from "./telegram";

admin.initializeApp();

export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  // Telegram enviará POST com update JSON
  try {
    const update = req.body;
    console.log("Telegram update received:", JSON.stringify(update));
    
    const bot = await setupTelegramHandlers();
    await bot.processUpdate(update);
    
    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("ERR");
  }
});

// Função auxiliar para registrar o webhook (executar manualmente uma vez)
export const registerWebhook = functions.https.onCall(async (data, context) => {
  try {
    const TelegramBot = require("node-telegram-bot-api");
    const token = process.env.TELEGRAM_TOKEN;
    const webhookUrl = process.env.BASE_URL || "https://seu-url-aqui.cloudfunctions.net/telegramWebhook";
    
    const bot = new TelegramBot(token);
    await bot.setWebHook(webhookUrl);
    
    return { success: true, message: `Webhook registrado em ${webhookUrl}` };
  } catch (err) {
    console.error("Erro ao registrar webhook:", err);
    throw new functions.https.HttpsError("internal", String(err));
  }
});
