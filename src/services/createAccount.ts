import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    Connection,
} from "@solana/web3.js";
import config from "../config/config";
import bs58 from "bs58";

import { CreatedAccount } from "../utils/types";
import { saveSponsoredAccount } from "../utils/db";

const connection = new Connection(config.SOLANA_DEVNET_RPC as string);

// Operator keypair (will own the created accounts)
const operatorKeypair = Keypair.fromSecretKey(
    bs58.decode(config.SPONSOR_PRIVATE_KEY)
);
const operatorPubkey = new PublicKey(config.SPONSOR_PUBKEY);

/**
 * Create a new system account owned by the operator
 * 
 * This account can later be reclaimed
 */
export async function createSystemAccount(
    initialBalanceSOL: number = 0.1 // Default 0.1 SOL
): Promise<CreatedAccount> {
    try {
        // Generate a new keypair for the account
        const newAccountKeypair = Keypair.generate();

        const newAccountPubkey = newAccountKeypair.publicKey;
        console.log(newAccountKeypair.secretKey)
        // Calculate rent-exempt minimum (for a basic system account with some data)
        const rentExemptMinimum = await connection.getMinimumBalanceForRentExemption(0);

        // Pass the initial balance
        const initialBalanceLamports = Math.max(
            rentExemptMinimum,
            Math.floor(initialBalanceSOL * LAMPORTS_PER_SOL)
        );

        // Create account instruction
        const createAccountInstruction = SystemProgram.createAccount({
            fromPubkey: operatorPubkey,
            newAccountPubkey: newAccountPubkey,
            lamports: initialBalanceLamports,
            space: 0,      // Empty account, can be increased if needed
            programId: SystemProgram.programId
        });

        // Create and send transaction
        const transaction = new Transaction().add(createAccountInstruction);

        // Get latest blockhash using Connection (consistent with sendRawTransaction)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = operatorPubkey;

        // Sign with both operator (payer) and new account (account being created)
        transaction.sign(operatorKeypair, newAccountKeypair);

        // Send transaction
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            maxRetries: 3
        });

        // Wait for confirmation with timeout
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        // Store the account in database

        const secretKeyString = Buffer.from(newAccountKeypair.secretKey).toString('base64');
        const save = saveSponsoredAccount(newAccountKeypair.publicKey.toString(), secretKeyString);
        if (!save) { console.error("Unable to store wallet") }

        return {
            success: true,
            accountPubkey: newAccountPubkey.toString(),
            signature,
            explorerURL: `https://solscan.io/account/${newAccountPubkey.toString()}?cluster=devnet`,
            accountType: "system",
            initialBalance: initialBalanceSOL
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
            error: error.message || "Failed to Create System Account"
        };
    }
}
