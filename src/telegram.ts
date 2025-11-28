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
        lastName,
        credits: 5,
        vip: false
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

async function saveUser(user: any, userId: string) {
  try {
    if (typeof user.save === "function") {
      await user.save();
      console.log("💾 user saved", { telegramId: user.telegramId });
    } else {
      const key = String(userId);
      memoryUsers.set(key, user);
    }
  } catch (e) {
    console.error("❌ erro ao salvar user:", e?.toString?.() || e);
  }
}

export async function setupTelegramHandlers(bot: any) {
  // /start command - show inline keyboard
  bot.onText(/\/start/, async (msg: any) => {
    const userId = msg.from!.id;
    const firstName = msg.from!.first_name;
    const chatId = msg.chat.id;

    try {
      await getOrCreateUser(userId, firstName, msg.from!.last_name || "");

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚽ Futebol", callback_data: "sport:football" },
              { text: "🏀 Basquete", callback_data: "sport:basketball" }
            ],
            [
              { text: "💰 Saldo", callback_data: "action:saldo" },
              { text: "⭐ VIP", callback_data: "action:vip" }
            ],
            [
              { text: "🛒 Comprar Créditos", callback_data: "action:buy" }
            ]
          ]
        }
      };

      try {
        const sent = await bot.sendMessage(
          chatId,
          `Olá ${firstName}! 👋\n\nSou o Bot GoalGuru 🤖\n\nEscolha uma opção abaixo:`,
          inlineKeyboard
        );
        console.log("📤 /start enviado", { chatId, message_id: sent?.message_id });
      } catch (err) {
        console.error("❌ erro ao enviar /start:", err?.toString?.() || err);
      }
    } catch (err) {
      console.error("Erro em /start:", err);
      try {
        await bot.sendMessage(chatId, "❌ Erro ao processar comando");
      } catch (e) {
        console.error("❌ erro ao enviar msg de erro:", e);
      }
    }
  });

  // Handle text messages for analysis
  bot.on("message", async (msg: any) => {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";

    // Ignore commands (handled by onText) and empty messages
    if (!text || text.startsWith("/") || text.startsWith("callback")) return;

    try {
      const user = await getOrCreateUser(userId, msg.from!.first_name);

      // Check if message looks like an analysis query (contains "x" or "vs")
      if (text.match(/\s+x\s+|\s+vs\s+/i)) {
        // User wants analysis
        if (user.credits < 1 && !user.vip) {
          console.log("⚠️ sem créditos", { userId, credits: user.credits });
          await bot.sendMessage(chatId, "❌ Sem créditos! Compre mais ou upgrade para VIP.");
          return;
        }

        const statusMsg = await bot.sendMessage(chatId, "⚙️ Analisando...");

        try {
          // Detect sport from lastSport or message hints
          let useBasket = user.lastSport === "basketball";
          const txtLower = text.toLowerCase();
          if (!user.lastSport) {
            if (text.startsWith("🏀") || txtLower.includes("basket")) {
              useBasket = true;
            }
          }

          // Run analysis
          let analysis = "";
          try {
            analysis = useBasket 
              ? await analyzeBasketball(text)
              : await analyzeFootball(text);
          } catch (analysisErr) {
            console.error("❌ analysis error:", analysisErr?.toString?.() || analysisErr);
            analysis = "❌ Erro ao analisar. Tente novamente.";
          }

          // Deduct credits if not VIP
          if (!user.vip) {
            user.credits = Math.max(0, (user.credits || 0) - 1);
            await saveUser(user, userId);
          }

          // Send analysis result
          try {
            await bot.editMessageText(analysis, {
              chat_id: chatId,
              message_id: statusMsg.message_id
            });
          } catch (editErr) {
            // If edit fails, send as new message
            console.warn("⚠️ editMessageText failed, sending new msg:", editErr?.toString?.() || editErr);
            await bot.sendMessage(chatId, analysis);
          }
        } catch (err) {
          console.error("❌ analysis flow error:", err?.toString?.() || err);
          try {
            await bot.editMessageText("❌ Erro ao processar análise", {
              chat_id: chatId,
              message_id: statusMsg.message_id
            });
          } catch (e) {
            await bot.sendMessage(chatId, "❌ Erro ao processar análise");
          }
        }
      } else {
        // Generic text (not an analysis query)
        console.log("📩 msg genérica:", { userId, text: text.substring(0, 50) });
        // Optionally, send a hint
        await bot.sendMessage(chatId, "ℹ️ Digite no formato: Time1 x Time2 para análise");
      }
    } catch (err) {
      console.error("Erro em message handler:", err);
    }
  });

  // Handle callback queries (inline keyboard buttons)
  bot.on("callback_query", async (cq: any) => {
    try {
      const data: string = cq.data || "";
      const from = cq.from;
      const chatId = cq.message?.chat?.id || from.id;

      // Answer the callback (dismiss the loading indicator)
      await bot.answerCallbackQuery(cq.id).catch(() => null);

      const user = await getOrCreateUser(String(from.id), from.first_name || "");

      console.log("📲 callback_query:", { userId: from.id, data, chatId });

      // Sport selection
      if (data && data.startsWith("sport:")) {
        const sport = data.split(":")[1];
        user.lastSport = sport === "basketball" ? "basketball" : "football";
        await saveUser(user, String(from.id));

        const msg = sport === "basketball"
          ? "🏀 Digite: Team1 x Team2"
          : "⚽ Digite: Time1 x Time2";

        await bot.sendMessage(chatId, msg);
        return;
      }

      // Balance check
      if (data === "action:saldo") {
        const credits = (user.credits || 0);
        const vipStatus = user.vip ? "⭐ VIP" : "sem VIP";
        await bot.sendMessage(chatId, `💰 Saldo: ${credits} créditos\n${vipStatus}`);
        return;
      }

      // VIP info
      if (data === "action:vip") {
        await bot.sendMessage(chatId, "⭐ VIP: R$ 9,90/mês\n✅ Análises ilimitadas\n✅ Sem anúncios");
        return;
      }

      // Buy credits
      if (data === "action:buy") {
        await bot.sendMessage(chatId, "🛒 50 créditos por R$ 19,90\n\nEscolha sua forma de pagamento");
        return;
      }

      console.warn("⚠️ unknown callback_data:", data);
    } catch (err) {
      console.error("Erro em callback_query:", err?.toString?.() || err);
    }
  });

  console.log("✅ Telegram handlers setup complete");
}
