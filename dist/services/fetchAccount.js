"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWalletInfo = fetchWalletInfo;
const kit_1 = require("@solana/kit");
const web3_js_1 = require("@solana/web3.js");
const rpc_1 = require("../config/rpc");
async function fetchWalletInfo(pubkey) {
    if (!pubkey?.trim())
        return null;
    try {
        // Validate base58 before hitting RPC
        new web3_js_1.PublicKey(pubkey.trim());
    }
    catch {
        return null;
    }
    const wallet = (0, kit_1.address)(pubkey.trim());
    const account = await rpc_1.DEVNET_SOLANA_CONNECTION.getAccountInfo(wallet).send();
    return {
        publicKey: wallet,
        explorerUrl: `https://solscan.io/account/${wallet}?cluster=devnet`,
        balance: account.value?.lamports,
        owner: account.value?.owner,
        executable: account.value?.executable,
    };
}
