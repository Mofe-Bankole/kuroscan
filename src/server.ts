import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import "./bot/telegram";
import config from "./config/config";
import { kuro } from "./bot/telegram";
import { kora } from "./lib/koraClient";
import { startAutoReclaimScheduler } from "./cron/autoReclaim";

const app = express();

if (!config.BOT_TOKEN) {
  console.error("Missing BOT_TOKEN — set it in your environment or .env file.");
  process.exit(1);
}

kuro.start();

export { kora };

app.use(express.urlencoded());
app.use(express.json());

const port = Number(process.env.PORT ?? config.PORT ?? 4070);

app.listen(port, async () => {
  console.log(
    `Bot Running ------------------------------------------------------ http://localhost:${port}`,
  );
  console.log(
    `Kora Node -------------------------------------------------------- ${config.KORA_RPC_URL}`,
  );
  console.log(
    `Telegram --------------------------------------------------------- https://t.me/@mui_scan_bot`,
  );

  if (process.env.ENABLE_AUTO_RECLAIM === "true") {
    startAutoReclaimScheduler();
    console.log("Auto-reclaim scheduler enabled (ENABLE_AUTO_RECLAIM=true).");
  }
});

app.get("/", async (req, res) => {
  try {
    const koraConfig = await kora.getConfig();
    res.status(200).json({
      message: "Kuroscan API",
      health: "OK",
      status: "active",
      statusCode: 200,
      sponsors: koraConfig.fee_payers,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(503).json({
      message: "Kuroscan API",
      health: "degraded",
      status: "kora_unreachable",
      detail: msg,
    });
  }
});

app.get("/api/v1/config", async (req, res) => {
  try {
    res.status(200).json({
      message: "Kuroscan API",
      health: "OK",
      status: "active",
      statusCode: 200,
      config: await kora.getConfig(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(503).json({
      message: "Kuroscan API",
      health: "degraded",
      status: "kora_unreachable",
      detail: msg,
    });
  }
});

// process;
