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

export async function setupTelegramHandlers(bot: TelegramBot) {
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

      await bot.sendMessage(
        chatId,
        `Olá ${firstName}! 👋\n\nSou o Bot GoalGuru.\n\nEscolha uma opção:`,
        keyboard
      );
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
        await bot.sendMessage(
          chatId,
          `💰 Saldo: ${user.credits} créditos\n${user.vip ? "⭐ VIP" : "sem VIP"}`
        );
        return;
      }

      if (text === "⭐ VIP") {
        await bot.sendMessage(chatId, "⭐ VIP: R$ 9,90/mês");
        return;
      }

      if (text === "🛒 Comprar Créditos") {
        await bot.sendMessage(chatId, "🛒 50 créditos por R$ 19,90");
        return;
      }

      if (text === "⚽ Futebol") {
        await bot.sendMessage(chatId, "⚽ Digite: Time1 x Time2");
        return;
      }

      if (text === "🏀 Basquete") {
        await bot.sendMessage(chatId, "🏀 Digite: Team1 x Team2");
        return;
      }

      if (text && text.match(/x/i)) {
        const user = await getOrCreateUser(userId, msg.from!.first_name);
        
        if (user.credits < 1 && !user.vip) {
          await bot.sendMessage(chatId, "❌ Sem créditos");
          return;
        }

        const statusMsg = await bot.sendMessage(chatId, "⚙️ Analisando...");

        try {
          const analysis = await analyzeFootball(text);
          
          if (!user.vip) {
            user.credits -= 1;
          }

          await bot.editMessageText(analysis, {
            chat_id: chatId,
            message_id: statusMsg.message_id
          });
        } catch (err) {
          await bot.editMessageText("❌ Erro", {
            chat_id: chatId,
            message_id: statusMsg.message_id
          });
        }
        return;
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });

  console.log("✅ Bot handlers OK");
}
