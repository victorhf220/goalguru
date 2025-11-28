import axios from "axios";

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const MP_API = "https://api.mercadopago.com/v1";

export async function createMercadoPagoLink(
  userId: string,
  type: "vip" | "credits",
  amount: number,
  credits?: number
): Promise<string> {
  try {
    const title = type === "vip" 
      ? "Assinatura VIP - 30 dias"
      : `${credits} Créditos`;

    const preference = {
      items: [
        {
          title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount
        }
      ],
      external_reference: `${type}-${userId}-${Date.now()}`,
      notification_url: `${process.env.VERCEL_URL || "http://localhost:3000"}/api/payment-webhook`,
      back_urls: {
        success: `${process.env.VERCEL_URL || "http://localhost:3000"}/?status=approved`,
        failure: `${process.env.VERCEL_URL || "http://localhost:3000"}/?status=pending`
      }
    };

    const response = await axios.post(`${MP_API}/checkout/preferences`, preference, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    return response.data.init_point;
  } catch (err: any) {
    console.error("Erro Mercado Pago:", err.response?.data || err.message);
    throw new Error("Erro ao processar pagamento");
  }
}
