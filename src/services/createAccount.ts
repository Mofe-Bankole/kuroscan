import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import config from "../config/config";
import { CreatedAccount } from "../utils/types";
import { saveSponsoredAccount } from "../utils/db";
import { createSolanaRpc } from "@solana/kit";
import { DEVNET_CONNECTION } from "../config/rpc";

// Operator keypair (will own the created accounts)
const operatorKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(config.KORA_PRIVATE_KEY)),
);

export const operatorPubkey = new PublicKey(operatorKeypair.publicKey);

export async function createSystemAccount(
  initialBalanceSOL: number = 0.1,
): Promise<CreatedAccount> {
  try {
    // Generate a new keypair for the account
    const AccountKeypair = Keypair.generate();

    const newAccountPubkey = AccountKeypair.publicKey;

    // Calculate rent-exempt minimum (for a basic system account with some data)
    const rentExemptMinimum =
      await DEVNET_CONNECTION.getMinimumBalanceForRentExemption(0);

    // Pass the initial balance
    const initialBalanceLamports = Math.max(
      rentExemptMinimum,
      Math.floor(initialBalanceSOL * LAMPORTS_PER_SOL),
    );

    // Create account instruction
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: operatorPubkey,
      newAccountPubkey: newAccountPubkey,
      lamports: initialBalanceLamports,
      space: 0,
      programId: SystemProgram.programId,
    });

    // Create and send transaction
    const transaction = new Transaction().add(createAccountInstruction);

    // Get latest blockhash using Connection (consistent with sendRawTransaction)
    const { blockhash, lastValidBlockHeight } =
      await DEVNET_CONNECTION.getLatestBlockhash("finalized");

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = operatorPubkey;

    // Sign with both operator (payer) and new account (account being created)
    transaction.sign(operatorKeypair, AccountKeypair);

    // Send transaction
    const signature = await DEVNET_CONNECTION.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3,
      },
    );

    // Wait for confirmation with timeout
    await DEVNET_CONNECTION.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    );

    // Store the account in database
    // In production hash the accounts private key
    const save = saveSponsoredAccount(
      AccountKeypair.publicKey.toString(),
      AccountKeypair.secretKey,
    );

    if (!save) {
      console.error("UNABLE TO STORE WALLET");
    }

    return {
      success: true,
      accountPubkey: newAccountPubkey.toString(),
      signature,
      explorerURL: `https://solscan.io/account/${newAccountPubkey.toString()}?cluster=devnet`,
      accountType: "system",
      initialBalance: initialBalanceSOL,
      accountPrivateKey: AccountKeypair.secretKey.toString(),
    };
  } catch (error: any) {
    console.error("Error Creating System Account:", error);

    return {
      success: false,
      accountPubkey: "",
      signature: "",
      explorerURL: "",
      accountType: "system",
      initialBalance: 0,
      error: error.message || "Failed to Create System Account",
      accountPrivateKey: "",
    };
  }
}
