import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import "./bot/telegram";
import config from "./config/config";
import { kuro } from "./bot/telegram";
import { KoraClient } from "@solana/kora";

const app = express();
kuro.start();

export const kora = new KoraClient({
  rpcUrl: config.KORA_RPC_URL,
});

app.use(express.urlencoded());
app.use(express.json());

app.get("/api/v1/health", async (req, res) => {
  res.status(200).json({
    message: "Kuroscan API",
    health: "OK",
    status: "active",
    statusCode: 200,
    data: (await kora.getConfig()).fee_payers,
  });
});
app.get("/api/v1/config", async (req, res) => {
  res.status(200).json({
    message: "Kuroscan API",
    health: "OK",
    status: "active",
    statusCode: 200,
    config: await kora.getConfig(),
  });
});

app.listen(process.env.PORT || 4070, async () => {
  console.log(
    `Bot Running ------------------------------------------------------ http://localhost:${config.PORT}`,
  );
  console.log(
    `Kora Node -------------------------------------------------------- ${config.KORA_RPC_URL}`,
  );
  console.log(
    `Telegram --------------------------------------------------------- https://t.me/@mui_scan_bot`,
  );
});
