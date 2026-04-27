"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReclaimableAccount = getReclaimableAccount;
const solana_1 = require("../utils/solana");
async function getReclaimableAccount(pubKey) {
    try {
        const accountInfo = await (0, solana_1.getAccountInfo)(pubKey);
        /**Exits if theres no account info */
        if (!accountInfo) {
            return {
                publicKey: pubKey,
                reclaimable: false,
                status: "closed",
                reason: "Account does not exist",
                lamports: 0n,
                rentExemptMinimum: null,
                reclaimableLamports: 0n,
                isSystemAccount: false,
            };
        }
        const lamports = BigInt(accountInfo.lamports ?? 0);
        /**Checks if the account is an executable and in this case cannot be reclaimed */
        if (accountInfo.executable) {
            return {
                publicKey: pubKey,
                reclaimable: false,
                status: "active",
                reason: "Executable (program) account",
                lamports,
                rentExemptMinimum: null,
                reclaimableLamports: 0n,
                isSystemAccount: false,
            };
        }
        /**If account is not from token_2022 it cannot be reclaimed */
        if (!accountInfo.isSystemAccount) {
            return {
                publicKey: pubKey,
                reclaimable: false,
                status: "active",
                reason: "Not a system account",
                lamports,
                rentExemptMinimum: null,
                reclaimableLamports: 0n,
                isSystemAccount: false,
            };
        }
        // ❌ Empty account
        // Can be Reclaimed
        if (lamports === 0n) {
            return {
                publicKey: pubKey,
                reclaimable: true,
                status: "active",
                reason: "Account Empty",
                lamports,
                rentExemptMinimum: null,
                reclaimableLamports: 0n,
                isSystemAccount: true,
            };
        }
        return {
            publicKey: pubKey,
            reclaimable: true,
            status: "active",
            reason: "Owned Account With Balance",
            lamports,
            rentExemptMinimum: null,
            reclaimableLamports: lamports,
            isSystemAccount: true,
        };
    }
    catch (err) {
        console.error(err);
        return {
            publicKey: pubKey,
            reclaimable: false,
            status: "closed",
            reason: "RPC error",
            lamports: null,
            rentExemptMinimum: null,
            reclaimableLamports: 0n,
            isSystemAccount: false,
        };
    }
}
