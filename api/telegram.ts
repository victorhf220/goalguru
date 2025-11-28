import { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log("🔔 Webhook chamado!");
    console.log("Method:", req.method);
    console.log("Body:", JSON.stringify(req.body));
    
    // Responder com sucesso
    res.status(200).json({ 
      ok: true, 
      message: "Webhook recebido",
      update_id: req.body?.update_id
    });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Erro ao processar" });
  }
};
