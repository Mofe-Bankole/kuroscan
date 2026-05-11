"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVNET_SOLANA_CONNECTION = exports.MAINNET_CONNECTION = exports.DEVNET_CONNECTION = void 0;
const kit_1 = require("@solana/kit");
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("./config"));
exports.DEVNET_CONNECTION = new web3_js_1.Connection("https://api.devnet.solana.com");
exports.MAINNET_CONNECTION = (0, kit_1.createSolanaRpc)(config_1.default.SOLANA_DEVNET_RPC);
exports.DEVNET_SOLANA_CONNECTION = (0, kit_1.createSolanaRpc)(config_1.default.SOLANA_DEVNET_RPC);
