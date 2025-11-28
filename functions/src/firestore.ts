import * as admin from "firebase-admin";

const db = admin.firestore();

export interface User {
  createdAt: admin.firestore.Timestamp;
  vip: boolean;
  vipExpiresAt?: number;
  credits: number;
  telegramId: string;
  firstName?: string;
  lastName?: string;
}

export async function ensureUserExists(userId: number, firstName?: string, lastName?: string): Promise<void> {
  const doc = db.collection("users").doc(String(userId));
  const snap = await doc.get();
  
  if (!snap.exists) {
    await doc.set({
      telegramId: String(userId),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      vip: false,
      credits: 5, // créditos iniciais
      firstName: firstName || "",
      lastName: lastName || ""
    });
  }
}

export async function getUser(userId: number): Promise<User | null> {
  const doc = await db.collection("users").doc(String(userId)).get();
  return doc.exists ? (doc.data() as User) : null;
}

export async function setVip(userId: number, expiresAt: number): Promise<void> {
  await db.collection("users").doc(String(userId)).update({
    vip: true,
    vipExpiresAt: expiresAt
  });
}

export async function addCredits(userId: number, amount: number): Promise<void> {
  const doc = db.collection("users").doc(String(userId));
  await doc.update({
    credits: admin.firestore.FieldValue.increment(amount)
  });
}

export async function deductCredits(userId: number, amount: number): Promise<boolean> {
  const user = await getUser(userId);
  if (!user || user.credits < amount) {
    return false; // créditos insuficientes
  }
  
  const doc = db.collection("users").doc(String(userId));
  await doc.update({
    credits: admin.firestore.FieldValue.increment(-amount)
  });
  return true;
}

export async function logAnalysis(userId: number, type: "futebol" | "basquete", query: string): Promise<void> {
  await db.collection("analyses").add({
    userId: String(userId),
    type,
    query,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

export async function recordPayment(
  userId: number,
  type: "vip" | "credits",
  amount: number,
  mpReference: string
): Promise<void> {
  await db.collection("payments").add({
    userId: String(userId),
    type,
    amount,
    mpReference,
    status: "pending",
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

export async function confirmPayment(mpReference: string): Promise<void> {
  const snap = await db.collection("payments")
    .where("mpReference", "==", mpReference)
    .limit(1)
    .get();
  
  if (!snap.empty) {
    const doc = snap.docs[0];
    const data = doc.data();
    await doc.ref.update({ status: "confirmed" });
    
    // aplicar benefício
    if (data.type === "vip") {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 dias
      await setVip(parseInt(data.userId), expiresAt);
    } else if (data.type === "credits") {
      await addCredits(parseInt(data.userId), data.amount / 10); // conversão arbitrary
    }
  }
}
