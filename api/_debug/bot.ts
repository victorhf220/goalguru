import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const token = process.env.TELEGRAM_TOKEN || null;

    if (!token) {
      return res.status(200).json({ ok: true, info: "no_token", token: null });
    }

    const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
    const resp = await axios.get(url, { timeout: 5000 });

    return res.status(200).json({
      ok: true,
      webhook: resp.data.result || null,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("/api/_debug/bot error:", err?.toString?.() || err);
    return res.status(500).json({ ok: false, error: err?.toString?.() || String(err) });
  }
};
