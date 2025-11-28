import { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const token = process.env.TELEGRAM_TOKEN || "NOT_SET";
    const tokenMasked = token === "NOT_SET" ? "NOT_SET" : token.substring(0, 10) + "..." + token.substring(token.length - 5);
    
    return res.status(200).json({
      ok: true,
      env: {
        TELEGRAM_TOKEN: tokenMasked,
        WEBHOOK_URL: process.env.WEBHOOK_URL ? "SET" : "NOT_SET",
        MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT_SET",
        NODE_ENV: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.toString?.() || String(err) });
  }
};
