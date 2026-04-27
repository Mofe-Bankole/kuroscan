"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorPubkey = exports.DEVNET_SOLANA_CONNECTION = exports.MAINNET_CONNECTION = exports.DEVNET_CONNECTION = void 0;
exports.createSystemAccount = createSystemAccount;
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("../config/config"));
const db_1 = require("../utils/db");
const kit_1 = require("@solana/kit");
exports.DEVNET_CONNECTION = new web3_js_1.Connection(config_1.default.SOLANA_DEVNET_RPC);
exports.MAINNET_CONNECTION = (0, kit_1.createSolanaRpc)(config_1.default.SOLANA_DEVNET_RPC);
exports.DEVNET_SOLANA_CONNECTION = (0, kit_1.createSolanaRpc)(config_1.default.SOLANA_DEVNET_RPC);
// Operator keypair (will own the created accounts)
const operatorKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(config_1.default.KORA_PRIVATE_KEY)));
exports.operatorPubkey = new web3_js_1.PublicKey(operatorKeypair.publicKey);
async function createSystemAccount(initialBalanceSOL = 0.1) {
    try {
        // Generate a new keypair for the account
        const AccountKeypair = web3_js_1.Keypair.generate();
        const newAccountPubkey = AccountKeypair.publicKey;
        // Calculate rent-exempt minimum (for a basic system account with some data)
        const rentExemptMinimum = await exports.DEVNET_CONNECTION.getMinimumBalanceForRentExemption(0);
        // Pass the initial balance
        const initialBalanceLamports = Math.max(rentExemptMinimum, Math.floor(initialBalanceSOL * web3_js_1.LAMPORTS_PER_SOL));
        // Create account instruction
        const createAccountInstruction = web3_js_1.SystemProgram.createAccount({
            fromPubkey: exports.operatorPubkey,
            newAccountPubkey: newAccountPubkey,
            lamports: initialBalanceLamports,
            space: 0,
            programId: web3_js_1.SystemProgram.programId,
        });
        // Create and send transaction
        const transaction = new web3_js_1.Transaction().add(createAccountInstruction);
        // Get latest blockhash using Connection (consistent with sendRawTransaction)
        const { blockhash, lastValidBlockHeight } = await exports.DEVNET_CONNECTION.getLatestBlockhash("finalized");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = exports.operatorPubkey;
        // Sign with both operator (payer) and new account (account being created)
        transaction.sign(operatorKeypair, AccountKeypair);
        // Send transaction
        const signature = await exports.DEVNET_CONNECTION.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
        });
        // Wait for confirmation with timeout
        await exports.DEVNET_CONNECTION.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        }, "confirmed");
        // Store the account in database
        // In production hash the accounts private key
        const save = (0, db_1.saveSponsoredAccount)(AccountKeypair.publicKey.toString(), AccountKeypair.secretKey);
        if (!save) {
            console.error("Unable to store wallet");
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
    }
    catch (error) {
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
