import TelegramBot from "node-telegram-bot-api";
import { User, Analysis } from "./db";
import { analyzeFootball } from "./analyzeFootball";
import { analyzeBasketball } from "./analyzeBasketball";
import { createMercadoPagoLink } from "./payments";

export async function setupTelegramHandlers(bot: TelegramBot) {
  // Command: /start
  bot.onText(/\/start/, async (msg: any) => {
    const userId = msg.from!.id;
    const firstName = msg.from!.first_name;
    const chatId = msg.chat.id;

    // Ensure user exists
    let user = await User.findOne({ telegramId: String(userId) });
    if (!user) {
      user = await User.create({
        telegramId: String(userId),
        firstName,
        lastName: msg.from!.last_name || ""
      });
    }

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
      `Olá ${firstName}! 👋\n\nSou o Bot de Análises de Futebol e Basquete.\n\nEscolha uma opção:`,
      keyboard
    );
  });

  // Command: /futebol Time1 x Time2
  bot.onText(/\/futebol\s+(.+)/i, async (msg: any, match: any) => {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const query = match![1];

    const user = await User.findOne({ telegramId: String(userId) });
    if (!user) {
      await bot.sendMessage(chatId, "❌ Erro ao carregar perfil");
      return;
    }

    if (!user.vip && user.credits < 1) {
      await bot.sendMessage(
        chatId,
        "❌ Créditos insuficientes. Compre créditos ou ative VIP."
      );
      return;
    }

    const statusMsg = await bot.sendMessage(chatId, "⏳ Analisando... aguarde");

    try {
      const result = await analyzeFootball(query);
      await bot.editMessageText(result, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown"
      });

      // Deduct credits if not VIP
      if (!user.vip) {
        await User.updateOne(
          { telegramId: String(userId) },
          { $inc: { credits: -1 } }
        );
      }

      // Log analysis
      await Analysis.create({
        userId: String(userId),
        type: "futebol",
        query,
        result
      });
    } catch (err: any) {
      await bot.editMessageText(`❌ Erro: ${err.message}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  });

  // Command: /basquete Time1 x Time2
  bot.onText(/\/basquete\s+(.+)/i, async (msg: any, match: any) => {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const query = match![1];

    const user = await User.findOne({ telegramId: String(userId) });
    if (!user) {
      await bot.sendMessage(chatId, "❌ Erro ao carregar perfil");
      return;
    }

    if (!user.vip && user.credits < 1) {
      await bot.sendMessage(chatId, "❌ Créditos insuficientes");
      return;
    }

    const statusMsg = await bot.sendMessage(chatId, "⏳ Analisando... aguarde");

    try {
      const result = await analyzeBasketball(query);
      await bot.editMessageText(result, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown"
      });

      if (!user.vip) {
        await User.updateOne(
          { telegramId: String(userId) },
          { $inc: { credits: -1 } }
        );
      }

      await Analysis.create({
        userId: String(userId),
        type: "basquete",
        query,
        result
      });
    } catch (err: any) {
      await bot.editMessageText(`❌ Erro: ${err.message}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  });

  // Text messages
  bot.on("message", async (msg: any) => {
    const text = msg.text || "";
    const chatId = msg.chat.id;
    const userId = msg.from!.id;

    if (text.startsWith("/")) return;

    const user = await User.findOne({ telegramId: String(userId) });
    if (!user) return;

    // Saldo
    if (text.toLowerCase().includes("saldo") || text === "💰 Saldo") {
      const vipStatus = user.vip ? "✅ VIP ativo" : "❌ Sem VIP";
      const expiresIn = user.vipExpiresAt
        ? Math.ceil((user.vipExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        : 0;

      await bot.sendMessage(
        chatId,
        `💼 *Seu Saldo*\n\n💳 Créditos: ${user.credits}\n${vipStatus}${user.vip && expiresIn > 0 ? ` (expira em ${expiresIn} dias)` : ""}`
      );
      return;
    }

    // VIP
    if (text.toLowerCase().includes("vip") || text === "⭐ VIP") {
      if (user.vip) {
        await bot.sendMessage(chatId, "✅ Você já é VIP!");
        return;
      }

      try {
        const link = await createMercadoPagoLink(String(userId), "vip", 29.9);
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💳 Comprar VIP - R$ 29,90", url: link }]
            ]
          }
        };

        await bot.sendMessage(
          chatId,
          "⭐ *VIP - 30 dias*\n\nDesfrute de análises ilimitadas!",
          keyboard
        );
      } catch (err: any) {
        await bot.sendMessage(chatId, `❌ Erro: ${err.message}`);
      }
      return;
    }

    // Comprar Créditos
    if (text.toLowerCase().includes("comprar") || text === "🛒 Comprar Créditos") {
      const options = [
        { credits: 5, price: 4.9 },
        { credits: 15, price: 12.9 },
        { credits: 50, price: 39.9 }
      ];

      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map((opt) => [
            {
              text: `${opt.credits} créditos - R$ ${opt.price.toFixed(2)}`,
              callback_data: `buy_credits_${opt.credits}_${opt.price}`
            }
          ])
        }
      };

      await bot.sendMessage(chatId, "💰 Escolha uma opção:", keyboard);
      return;
    }
  });

  // Callbacks
  bot.on("callback_query", async (query: any) => {
    const data = query.data;
    const chatId = query.message!.chat.id;
    const userId = query.from.id;

    if (data.startsWith("buy_credits_")) {
      const parts = data.split("_");
      const credits = parseInt(parts[2]);
      const price = parseFloat(parts[3]);

      try {
        const link = await createMercadoPagoLink(String(userId), "credits", price, credits);
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💳 Pagar com Mercado Pago", url: link }]
            ]
          }
        };

        await bot.editMessageText(
          `💰 ${credits} créditos - R$ ${price.toFixed(2)}\n\nClique abaixo para pagar:`,
          {
            chat_id: chatId,
            message_id: query.message!.message_id,
            ...keyboard
          }
        );
      } catch (err: any) {
        await bot.answerCallbackQuery(query.id, { text: `Erro: ${err.message}`, show_alert: true });
      }
    }
  });
}
