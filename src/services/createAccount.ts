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

const connection = new Connection(config.SOLANA_DEVNET_RPC as string || "https://api.devnet.solana.com/");

// Operator keypair (will own the created accounts)
const operatorKeypair = Keypair.fromSecretKey(
   Uint8Array.from([124,229,56,205,106,195,19,22,206,95,145,70,34,151,34,24,233,131,206,198,147,216,120,95,130,70,219,103,51,140,99,145,209,162,4,18,85,86,144,21,25,113,237,80,214,112,64,206,172,53,129,126,117,22,173,144,212,208,28,22,81,223,3,159])
);
console.log(operatorKeypair.secretKey)
const operatorPubkey = new PublicKey(operatorKeypair.publicKey);
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
        const AccountKeypair = Keypair.generate();

        const newAccountPubkey = AccountKeypair.publicKey;

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
            space: 0,     
            programId: SystemProgram.programId,
        });

        // Create and send transaction
        const transaction = new Transaction().add(createAccountInstruction);

        // Get latest blockhash using Connection (consistent with sendRawTransaction)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = operatorPubkey;

        // Sign with both operator (payer) and new account (account being created)
        transaction.sign(operatorKeypair, AccountKeypair);

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
        // In production hash the accounts private key
        const save = saveSponsoredAccount(AccountKeypair.publicKey.toString(), AccountKeypair.secretKey.toString());
        if (!save) { console.error("Unable to store wallet") }

        return {
            success: true,
            accountPubkey: newAccountPubkey.toString(),
            signature,
            explorerURL: `https://solscan.io/account/${newAccountPubkey.toString()}?cluster=devnet`,
            accountType: "system",
            initialBalance: initialBalanceSOL,
            accountPrivateKey : AccountKeypair.secretKey.toString()
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
            accountPrivateKey : ""
        };
    }
}
