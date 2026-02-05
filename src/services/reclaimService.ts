import config from "../config/config";
import { getReclaimableAccount } from "./getReclaimables";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { ReClaimedSolTransaction } from "../utils/types";
import { OPERATOR_KEYPAIR,OPERATOR_PUBKEY } from "../utils/constants";
import { fetchSponsoredAccount } from "../utils/db";
import { decrypt } from "../utils/crypto";
const connection = new Connection(
  config.SOLANA_DEVNET_RPC as string,
  "confirmed",
);

export async function reclaimSystemAccount(
  accountPubkey: string,
): Promise<ReClaimedSolTransaction> {
  if (!accountPubkey) {
    return {
      success: false,
      signature: "",
      explorerURL: "",
      amount: 0,
      error: "Account public key is required",
    };
  }

  try {
    const accountInfo = await getReclaimableAccount(accountPubkey);

    if (!accountInfo || !accountInfo.reclaimable) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: accountInfo?.reason || "Account cannot be reclaimed",
      };
    }

    if (accountInfo.status === "closed") {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: "Account has been closed",
      };
    }

    if (!accountInfo.isSystemAccount) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: "Account is not a system account",
      };
    }

    if (
      !accountInfo.reclaimableLamports ||
      (typeof accountInfo.reclaimableLamports === "bigint"
        ? accountInfo.reclaimableLamports <= 0n
        : Number(accountInfo.reclaimableLamports) <= 0)
    ) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: "No reclaimable lamports",
      };
    }

    // The account being reclaimed (source)
    const fromPubkey = new PublicKey(accountPubkey);
    // The operator's account (destination - where reclaimed SOL goes)
    const toPubkey = OPERATOR_PUBKEY;

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

    // Create a transaction to transfer lamports
    const reclaimLamports = typeof accountInfo.reclaimableLamports === "bigint" 
      ? Number(accountInfo.reclaimableLamports)
      : Number(accountInfo.reclaimableLamports);

    if (reclaimLamports <= 0) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: "No reclaimable lamports",
      };
    }

    const transaction = new Transaction({
      feePayer: OPERATOR_PUBKEY,
      recentBlockhash: blockhash
    }).add(
      SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        lamports: reclaimLamports,
      }),
    );

    // Fetch the encrypted secret key from DB (should return an array)
    const account_secret_key = await fetchSponsoredAccount(
      fromPubkey.toString(),
    );

    // console.log(account_secret_key[0])

    if (!account_secret_key || !account_secret_key[0] || !account_secret_key[0].secret_key) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: "Private key for account not found in DB. You must own the account.",
      };
    }

    let ACCOUNT_PRIVATE_KEY: Keypair;

    try {
      const decryptedSecretKey = decrypt(account_secret_key[0].secret_key); // <-- fixed: was [1], use [0]
      ACCOUNT_PRIVATE_KEY = Keypair.fromSecretKey(Uint8Array.from(decryptedSecretKey));
      console.log(ACCOUNT_PRIVATE_KEY);
    } catch (e) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: "Unable to decrypt account private key",
      };
    }

    let signature: string;

    try {
      signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [ACCOUNT_PRIVATE_KEY], // Account owner must sign
        {
          commitment: "confirmed",
          skipPreflight: false,
        },
      );
    } catch (err: any) {
      return {
        success: false,
        signature: "",
        explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
        amount: 0,
        error: `Transaction failed: ${err?.message || err}. You may not own this account. To reclaim, you need the account's private key.`,
      };
    }

    const reclaimedAmount =
      Number(accountInfo.reclaimableLamports) / LAMPORTS_PER_SOL;

    return {
      success: true,
      signature,
      explorerURL: `https://solscan.io/tx/${signature}?cluster=devnet`,
      amount: reclaimedAmount,
      error: null,
    };
  } catch (error: any) {
    console.error("Error in reclaimSystemAccount:", error);
    return {
      success: false,
      signature: "",
      explorerURL: `https://solscan.io/account/${accountPubkey}?cluster=devnet`,
      amount: 0,
      error: error.message || "Unknown error occurred",
    };
  }
}
