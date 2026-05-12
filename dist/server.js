"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kora = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
require("./bot/telegram");
const config_1 = __importDefault(require("./config/config"));
const telegram_1 = require("./bot/telegram");
const koraClient_1 = require("./lib/koraClient");
Object.defineProperty(exports, "kora", { enumerable: true, get: function () { return koraClient_1.kora; } });
const autoReclaim_1 = require("./cron/autoReclaim");
const app = (0, express_1.default)();
if (!config_1.default.BOT_TOKEN) {
    console.error("Missing BOT_TOKEN — set it in your environment or .env file.");
    process.exit(1);
}
telegram_1.kuro.start();
app.use(express_1.default.urlencoded());
app.use(express_1.default.json());
const port = Number(process.env.PORT ?? config_1.default.PORT ?? 4070);
app.listen(port, async () => {
    console.log(`Bot Running ------------------------------------------------------ http://localhost:${port}`);
    console.log(`Kora Node -------------------------------------------------------- ${config_1.default.KORA_RPC_URL}`);
    console.log(`Telegram --------------------------------------------------------- https://t.me/@mui_scan_bot`);
    if (process.env.ENABLE_AUTO_RECLAIM === "true") {
        (0, autoReclaim_1.startAutoReclaimScheduler)();
        console.log("Auto-reclaim scheduler enabled (ENABLE_AUTO_RECLAIM=true).");
    }
});
app.get("/", async (req, res) => {
    try {
        const koraConfig = await koraClient_1.kora.getConfig();
        res.status(200).json({
            message: "Kuroscan API",
            health: "OK",
            status: "active",
            statusCode: 200,
            sponsors: koraConfig.fee_payers,
        });
    }
    catch (e) {
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
            config: await koraClient_1.kora.getConfig(),
        });
    }
    catch (e) {
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
