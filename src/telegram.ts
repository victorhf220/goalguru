import TelegramBot from "node-telegram-bot-api";
import { User, Analysis } from "./db";
import { analyzeFootball } from "./analyzeFootball";
import { analyzeBasketball } from "./analyzeBasketball";
import { createMercadoPagoLink } from "./payments";

// In-memory user storage (fallback)
const memoryUsers: Map<string, any> = new Map();

async function getOrCreateUser(userId: string, firstName: string, lastName: string = "") {
  try {
    let user = await User.findOne({ telegramId: String(userId) });
    if (!user) {
      user = await User.create({
        telegramId: String(userId),
        firstName,
        lastName
      });
    }
    return user;
  } catch (err) {
    const key = String(userId);
    if (!memoryUsers.has(key)) {
      memoryUsers.set(key, {
        telegramId: String(userId),
        firstName,
        lastName,
        vip: false,
        credits: 5
      });
    }
    return memoryUsers.get(key);
  }
}

export async function setupTelegramHandlers(bot: any) {
  bot.onText(/\/start/, async (msg: any) => {
    const userId = msg.from!.id;
    const firstName = msg.from!.first_name;
    const chatId = msg.chat.id;

    try {
      await getOrCreateUser(userId, firstName, msg.from!.last_name || "");

      const keyboard = {
        reply_markup: {
          keyboard: [
            [{ text: "⚽ Futebol" }, { text: "🏀 Basquete" }],
            [{ text: "💰 Saldo" }, { text: "⭐ VIP" }],
            [{ text: "🛒 Comprar Créditos" }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      };

      try {
        const sent = await bot.sendMessage(
          chatId,
          `Olá ${firstName}! 👋\n\nSou o Bot GoalGuru.\n\nEscolha uma opção:`,
          keyboard
        );
        console.log("📤 sendMessage OK", { chatId, message_id: sent?.message_id });
      } catch (err) {
        console.error("❌ sendMessage /start erro:", err?.toString?.() || err);
      }
    } catch (err) {
      console.error("Erro em /start:", err);
      await bot.sendMessage(chatId, "❌ Erro ao processar");
    }
  });

  bot.on("message", async (msg: any) => {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith("/")) return;

    try {
      if (text === "💰 Saldo") {
        const user = await getOrCreateUser(userId, msg.from!.first_name);
        try {
          const sent = await bot.sendMessage(
            chatId,
            `💰 Saldo: ${user.credits} créditos\n${user.vip ? "⭐ VIP" : "sem VIP"}`
          );
          console.log("📤 sendMessage Saldo OK", { chatId, message_id: sent?.message_id });
        } catch (err) {
          console.error("❌ sendMessage Saldo erro:", err?.toString?.() || err);
        }
        return;
      }

      if (text === "⭐ VIP") {
        try {
          const sent = await bot.sendMessage(chatId, "⭐ VIP: R$ 9,90/mês");
          console.log("📤 sendMessage VIP OK", { chatId, message_id: sent?.message_id });
        } catch (err) {
          console.error("❌ sendMessage VIP erro:", err?.toString?.() || err);
        }
        return;
      }

      if (text === "🛒 Comprar Créditos") {
        try {
          const sent = await bot.sendMessage(chatId, "🛒 50 créditos por R$ 19,90");
          console.log("📤 sendMessage Comprar OK", { chatId, message_id: sent?.message_id });
        } catch (err) {
          console.error("❌ sendMessage Comprar erro:", err?.toString?.() || err);
        }
        return;
      }

      if (text === "⚽ Futebol") {
        try {
          const sent = await bot.sendMessage(chatId, "⚽ Digite: Time1 x Time2");
          console.log("📤 sendMessage Futebol OK", { chatId, message_id: sent?.message_id });
        } catch (err) {
          console.error("❌ sendMessage Futebol erro:", err?.toString?.() || err);
        }
        return;
      }

      if (text === "🏀 Basquete") {
        try {
          const sent = await bot.sendMessage(chatId, "🏀 Digite: Team1 x Team2");
          console.log("📤 sendMessage Basquete OK", { chatId, message_id: sent?.message_id });
        } catch (err) {
          console.error("❌ sendMessage Basquete erro:", err?.toString?.() || err);
        }
        return;
      }

      if (text && text.match(/x/i)) {
        const user = await getOrCreateUser(userId, msg.from!.first_name);
        
        if (user.credits < 1 && !user.vip) {
          await bot.sendMessage(chatId, "❌ Sem créditos");
          return;
        }

        let statusMsg: any = null;
        try {
          statusMsg = await bot.sendMessage(chatId, "⚙️ Analisando...");
          console.log("📤 sendMessage Analisando OK", { chatId, message_id: statusMsg?.message_id });
        } catch (err) {
          console.error("❌ sendMessage Analisando erro:", err?.toString?.() || err);
        }

        try {
          const analysis = await analyzeFootball(text);

          if (!user.vip) {
            user.credits -= 1;
          }

          if (statusMsg) {
            try {
              const edited = await bot.editMessageText(analysis, {
                chat_id: chatId,
                message_id: statusMsg.message_id
              });
              console.log("🔧 editMessageText OK", { chatId, edited });
            } catch (err) {
              console.error("❌ editMessageText erro:", err?.toString?.() || err);
              await bot.sendMessage(chatId, analysis);
            }
          } else {
            await bot.sendMessage(chatId, analysis);
          }
        } catch (err) {
          console.error("❌ analysis erro:", err?.toString?.() || err);
          if (statusMsg) {
            try {
              await bot.editMessageText("❌ Erro", {
                chat_id: chatId,
                message_id: statusMsg.message_id
              });
            } catch (e) {
              console.error("❌ editMessageText fallback erro:", e?.toString?.() || e);
              await bot.sendMessage(chatId, "❌ Erro ao analisar");
            }
          } else {
            await bot.sendMessage(chatId, "❌ Erro ao analisar");
          }
        }
        return;
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });

  console.log("✅ Bot handlers OK");
}
