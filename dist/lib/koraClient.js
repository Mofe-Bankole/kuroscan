"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kora = void 0;
const kora_1 = require("@solana/kora");
const config_1 = __importDefault(require("../config/config"));
/** Shared Kora client — keep out of `server.ts` to avoid circular imports with the bot. */
exports.kora = new kora_1.KoraClient({
    rpcUrl: config_1.default.KORA_RPC_URL,
});
