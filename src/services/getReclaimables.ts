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

        // ❌ Program accounts are NEVER reclaimable
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

        // ❌ Non-system accounts: reject early
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
                reclaimable: false,
                status: "closed",
                reason: "Account already drained",
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

export async function getReclaimableAmount(pubkey: string): Promise<ReClaimableAmountInfo> {
    try {
        const addr = address(pubkey)
        const accountInfoResponse = await rpc.getAccountInfo(addr).send();
        const accountInfo = accountInfoResponse.value;

        const balanceResponse = (await rpc.getBalance(addr).send()).value
        const balance = Math.abs(parseFloat(balanceResponse.toString()) / LAMPORTS_PER_SOL)

        if (!accountInfo) {
            return {
                rentExemptMinimum: 0n,
                balance: 0,
                balanceLamports: 0n,
                rentExemptMinimumSOL: 0,
                reclaimableAmount: 0n,
                reclaimableLamports: 0n
            }
        }

        const rentExemptMinimum = await rpc.getMinimumBalanceForRentExemption(accountInfo.data.length as any).send()
        const rentExemptMinimumSOL = parseFloat(rentExemptMinimum?.toString() || "") / LAMPORTS_PER_SOL;
        const reclaimableLamports = accountInfo.lamports - rentExemptMinimum;
        const reclaimableAmount = reclaimableLamports - BigInt(LAMPORTS_PER_SOL);

        return {
            balance,
            reclaimableAmount,
            balanceLamports: accountInfo.lamports,
            rentExemptMinimum,
            rentExemptMinimumSOL,
            reclaimableLamports
        }
    } catch (error) {
        console.error("Error calculating reclaimable amount:", error);
        throw error;
    }
}

// Get the rent
export async function getRentExemptMinimum(data: number) {
    if (!data) return null;

    try {
        // getMinimumBalanceForRentExemption expects a number or bigint for space
        let dataLength = BigInt(data)
        const minimumResponse = await rpc.getMinimumBalanceForRentExemption(dataLength).send();
        const minimum = minimumResponse;
        return parseFloat(minimum.toString())
    } catch (error) {
        console.error(error);
        return null;
    }
}