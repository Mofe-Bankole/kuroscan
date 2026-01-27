import config from "../config/config";
import { getReclaimableAccount } from "./getReclaimables";
import { PublicKey, SystemProgram, Keypair, Transaction, sendAndConfirmTransaction, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ReClaimedSolTransaction } from "../utils/types";
import { OPERATOR_KEYPAIR, OPERATOR_PUBKEY } from "../utils/constants";
import { fetchSponsoredAccount } from "../utils/db";

const connection = new Connection(config.SOLANA_DEVNET_RPC as string, "confirmed");

export async function reclaimSystemAccount(accountPubkey: string): Promise<ReClaimedSolTransaction> {
    if (!accountPubkey) {
        return {
            success: false,
            signature: "",
            explorerURL: "",
            amount: 0,
            error: "Account public key is required"
        };
    }

    try {
        const accountInfo = await getReclaimableAccount(accountPubkey);

        if (!accountInfo.reclaimable) {
            return {
                success: false,
                signature: "",
                explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
                amount: 0,
                error: accountInfo.reason || "Account cannot be reclaimed"
            };
        }

        if (accountInfo.status === "closed") {
            return {
                success: false,
                signature: "",
                explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
                amount: 0,
                error: "Account has been closed"
            };
        }

        if (!accountInfo.isSystemAccount) {
            return {
                success: false,
                signature: "",
                explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
                amount: 0,
                error: "Account is not a system account"
            };
        }

        if (!accountInfo.reclaimableLamports || accountInfo.reclaimableLamports <= 0n) {
            return {
                success: false,
                signature: "",
                explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
                amount: 0,
                error: "No reclaimable lamports"
            };
        }

        // The account being reclaimed (source)
        const fromPubkey = new PublicKey(accountPubkey);
        // The operator's account (destination - where reclaimed SOL goes)
        const toPubkey = OPERATOR_PUBKEY;

        // Get latest blockhash
        const { blockhash } = await connection.getLatestBlockhash("finalized");

        // Create a transaction to transfer lamports
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromPubkey,
                toPubkey: toPubkey,
                lamports: Number(accountInfo.reclaimableLamports)
            })
        );

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = OPERATOR_PUBKEY;
        const account_secret_key = await fetchSponsoredAccount(fromPubkey)
        // Sign and send the transaction
        // NOTE: This will only work if you own the account (have its private key)
        // For accounts you don't own, this will fail
        let signature: string;
        try {
            signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [OPERATOR_KEYPAIR], // Signs as fee payer, but account owner must also sign
                {
                    commitment: 'confirmed',
                    skipPreflight: false
                }
            );
        } catch (err: any) {
            return {
                success: false,
                signature: "",
                explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
                amount: 0,
                error: `Transaction failed: ${err.message}. You may not own this account. To reclaim, you need the account's private key.`
            };
        }

        const reclaimedAmount = Number(accountInfo.reclaimableLamports) / LAMPORTS_PER_SOL;

        return {
            success: true,
            signature,
            explorerURL: `https://solscan.io/tx/${signature}?cluster=devnet`,
            amount: reclaimedAmount,
            error: null
        };
    } catch (error: any) {
        console.error("Error in reclaimSystemAccount:", error);
        return {
            success: false,
            signature: "",
            explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
            amount: 0,
            error: error.message || "Unknown error occurred"
        };
    }
}