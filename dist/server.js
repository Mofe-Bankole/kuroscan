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
const kora_1 = require("@solana/kora");
const app = (0, express_1.default)();
telegram_1.kuro.start();
exports.kora = new kora_1.KoraClient({
    rpcUrl: config_1.default.KORA_RPC_URL,
});
app.use(express_1.default.urlencoded());
app.use(express_1.default.json());
const now = Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "medium",
}).format(new Date());
app.get("/api/v1/health", async (req, res) => {
    res.status(200).json({
        message: "Kuroscan API",
        health: "OK",
        status: "active",
        statusCode: 200,
        data: (await exports.kora.getConfig()).fee_payers,
    });
});
app.listen(process.env.PORT || 4070, async () => {
    console.log(`Bot Running ------------------------------------------------------ http://localhost:${config_1.default.PORT}`);
    console.log(`Kora Node -------------------------------------------------------- ${config_1.default.KORA_RPC_URL}`);
    console.log(`Telegram --------------------------------------------------------- https://t.me/@mui_scan_bot`);
});
