import { address, createSolanaRpc } from "@solana/kit";

import { ReClaimableAccount, ReClaimableAmountInfo } from "../utils/types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import config from "../config/config";
import { getAccountInfo } from "../utils/solana";

const rpc = createSolanaRpc(config.SOLANA_DEVNET_RPC as string);

export async function getReclaimableAccount(
    pubKey: string
): Promise<ReClaimableAccount> {
    try {
        const accountInfo = await getAccountInfo(pubKey);

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
        
        /**Checks if the account is an executable and in this case cannotbe reclaimed */
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
    } catch (err) {
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