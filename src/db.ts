import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/goalguru";

export async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado ao MongoDB");
  } catch (err) {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
    throw err;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true, required: true },
  firstName: String,
  lastName: String,
  vip: { type: Boolean, default: false },
  vipExpiresAt: Number,
  credits: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);

// Analysis Schema
const analysisSchema = new mongoose.Schema({
  userId: String,
  type: String,
  query: String,
  result: String,
  createdAt: { type: Date, default: Date.now }
});

export const Analysis = mongoose.model("Analysis", analysisSchema);

// Payment Schema
const paymentSchema = new mongoose.Schema({
  userId: String,
  type: String,
  amount: Number,
  reference: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

export const Payment = mongoose.model("Payment", paymentSchema);
