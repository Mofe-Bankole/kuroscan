"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWalletInfo = fetchWalletInfo;
const kit_1 = require("@solana/kit");
const createAccount_1 = require("./createAccount");
async function fetchWalletInfo(pubkey) {
    if (!pubkey)
        return;
    const wallet = (0, kit_1.address)(pubkey);
    const account = await createAccount_1.DEVNET_SOLANA_CONNECTION.getAccountInfo(wallet).send();
    return {
        publicKey: wallet,
        explorerUrl: `https://solscan.io/account/${wallet}?cluster=devnet`,
        balance: account.value?.lamports,
        owner: account.value?.owner,
        executable: account.value?.executable
    };
}
