"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATOR_PUBKEY = exports.SYSTEM_PROGRAM = exports.TOKEN_2022_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("../config/config"));
exports.TOKEN_PROGRAM_ID = new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
exports.TOKEN_2022_PROGRAM_ID = new web3_js_1.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
exports.SYSTEM_PROGRAM = new web3_js_1.PublicKey("11111111111111111111111111111111");
exports.OPERATOR_PUBKEY = new web3_js_1.PublicKey(config_1.default.SPONSOR_PUBKEY);
