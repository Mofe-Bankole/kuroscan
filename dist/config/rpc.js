"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAINNET_SOLANA_CONNECTION = exports.DEVNET_SOLANA_CONNECTION = exports.DEVNET_CONNECTION = void 0;
const kit_1 = require("@solana/kit");
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("./config"));
/** Public devnet HTTP endpoint used by @solana/web3.js Connection helpers. */
const devnetHttpUrl = config_1.default.SOLANA_DEVNET_RPC ||
    config_1.default.HELIUS_DEVNET_RPC ||
    "https://api.devnet.solana.com";
exports.DEVNET_CONNECTION = new web3_js_1.Connection(devnetHttpUrl, "confirmed");
/** Kit RPC client (same cluster as {@link DEVNET_CONNECTION}). */
exports.DEVNET_SOLANA_CONNECTION = (0, kit_1.createSolanaRpc)(devnetHttpUrl);
/** Optional mainnet Kit client when `SOLANA_MAINNET_RPC` is set. */
exports.MAINNET_SOLANA_CONNECTION = config_1.default.SOLANA_MAINNET_RPC
    ? (0, kit_1.createSolanaRpc)(config_1.default.SOLANA_MAINNET_RPC)
    : null;
