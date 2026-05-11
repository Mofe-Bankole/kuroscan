"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.getAccountInfo = getAccountInfo;
const kit_1 = require("@solana/kit");
const config_1 = __importDefault(require("../config/config"));
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const rpc = (0, kit_1.createSolanaRpc)(config_1.default.SOLANA_DEVNET_RPC);
async function getBalance(pubKey) {
    const addr = (0, kit_1.address)(pubKey);
    const data = await rpc.getBalance(addr).send();
    const res = Math.abs(parseFloat(data.value.toString()) / web3_js_1.LAMPORTS_PER_SOL);
    return res;
}
// Get account Info
async function getAccountInfo(pubKey) {
    try {
        const balanceResponse = await getBalance(pubKey);
        const accountInfoResponse = await rpc
            .getAccountInfo((0, kit_1.address)(pubKey.trim()))
            .send();
        const accountInfo = accountInfoResponse.value;
        const explorerUrl = `https://solscan.io/account/${pubKey}?cluster=devnet`;
        let data = accountInfo?.data.length || 0;
        if (!accountInfo) {
            return {
                balance: null,
                data: null,
                publicKey: pubKey,
                explorer: null,
                executable: false,
                owner: null,
                space: null,
                exists: false,
                status: "closed",
                isSystemAccount: false,
                isTokenAccount: false,
                lamports: 0n,
            };
        }
        const isSystemAccount = accountInfo.owner.toString() === constants_1.SYSTEM_PROGRAM.toString();
        const isTokenAccount = accountInfo.owner.toString() === constants_1.TOKEN_PROGRAM_ID.toString();
        console.log(accountInfo.owner.toString());
        return {
            publicKey: pubKey,
            balance: balanceResponse,
            exists: true,
            explorer: explorerUrl,
            executable: accountInfo?.executable || false,
            owner: accountInfo?.owner.toString() || "",
            space: accountInfo?.space.toString() || "",
            status: "active",
            isSystemAccount,
            isTokenAccount,
            lamports: BigInt(accountInfo?.lamports || 0),
            data,
        };
    }
    catch (error) {
        console.error(`Error : ${error}`);
        throw error;
    }
}
