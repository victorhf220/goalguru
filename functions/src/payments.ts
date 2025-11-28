import * as functions from "firebase-functions";
import axios from "axios";
import { confirmPayment } from "./firestore";

// Usando a API de preferências do Mercado Pago (mais recente que SDK)
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
const MP_API_BASE = "https://api.mercadopago.com/v1";

export async function createMercadoPagoPreference(
  userId: string,
  type: "vip" | "credits",
  amount: number
): Promise<{ init_point: string; id: string }> {
  try {
    const preference = {
      items: [
        {
          title: type === "vip" ? "Assinatura VIP - 30 dias" : `Créditos Analytics - R$ ${amount.toFixed(2)}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount
        }
      ],
      payer: {
        email: `user-${userId}@goalguru.local` // fake email; ajuste conforme necessário
      },
      external_reference: `${type}-${userId}-${Date.now()}`,
      notification_url: process.env.MP_WEBHOOK_URL || "https://seu-webhook.cloudfunctions.net/mercadoPagoWebhook",
      back_urls: {
        success: "https://seu-app.com/success",
        failure: "https://seu-app.com/failure",
        pending: "https://seu-app.com/pending"
      },
      auto_return: "approved"
    };

    const response = await axios.post(
      `${MP_API_BASE}/checkout/preferences`,
      preference,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      init_point: response.data.init_point,
      id: response.data.id
    };
  } catch (err: any) {
    console.error("Erro ao criar preferência Mercado Pago:", err.response?.data || err.message);
    throw new Error(`Erro Mercado Pago: ${err.message}`);
  }
}

export const mercadoPagoWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      // Buscar detalhes do pagamento
      const paymentId = data.id;
      const response = await axios.get(
        `${MP_API_BASE}/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
        }
      );

      const payment = response.data;
      if (payment.status === "approved") {
        // Confirmar no Firestore e aplicar benefícios
        const reference = payment.external_reference;
        await confirmPayment(reference);
        console.log(`Pagamento confirmado: ${reference}`);
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Erro no webhook Mercado Pago:", err);
    res.status(500).send("ERR");
  }
});
