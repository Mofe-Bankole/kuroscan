"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reclaimSponsoredAccounts = reclaimSponsoredAccounts;
const bs58_1 = __importDefault(require("bs58"));
const web3_js_1 = require("@solana/web3.js");
const createAccount_1 = require("./createAccount");
const getReclaimables_1 = require("./getReclaimables");
const db_1 = require("../utils/db");
async function reclaimSingleAccount(account) {
    const reclaimInfo = await (0, getReclaimables_1.getReclaimableAccount)(account.public_key);
    if (!reclaimInfo.reclaimable) {
        return {
            account: account.public_key,
            destination: account.owner_public_key,
            success: false,
            lamports: 0n,
            reason: reclaimInfo.reason,
        };
    }
    if (!account.owner_public_key) {
        return {
            account: account.public_key,
            destination: "",
            success: false,
            lamports: 0n,
            reason: "Missing destination owner_public_key",
        };
    }
    if (reclaimInfo.reclaimableLamports <= 0n) {
        return {
            account: account.public_key,
            destination: account.owner_public_key,
            success: false,
            lamports: 0n,
            reason: "No reclaimable lamports",
        };
    }
    const signer = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(account.secret_key));
    const destination = new web3_js_1.PublicKey(account.owner_public_key);
    const latestBlockhash = await createAccount_1.DEVNET_CONNECTION.getLatestBlockhash("confirmed");
    const feeProbe = new web3_js_1.Transaction({
        feePayer: signer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
    }).add(web3_js_1.SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: destination,
        lamports: 1,
    }));
    const estimatedFee = BigInt((await createAccount_1.DEVNET_CONNECTION.getFeeForMessage(feeProbe.compileMessage())).value ?? 0);
    if (reclaimInfo.reclaimableLamports <= estimatedFee) {
        return {
            account: account.public_key,
            destination: account.owner_public_key,
            success: false,
            lamports: reclaimInfo.reclaimableLamports,
            reason: "Balance too small to cover transaction fee",
        };
    }
    const lamportsToSend = reclaimInfo.reclaimableLamports - estimatedFee;
    const transaction = new web3_js_1.Transaction({
        feePayer: signer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
    }).add(web3_js_1.SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: destination,
        lamports: Number(lamportsToSend),
    }));
    transaction.sign(signer);
    const signature = await createAccount_1.DEVNET_CONNECTION.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
    });
    await createAccount_1.DEVNET_CONNECTION.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, "confirmed");
    await (0, db_1.updateSponsoredAccountStatus)(account.public_key, "reclaimed");
    return {
        account: account.public_key,
        destination: account.owner_public_key,
        success: true,
        lamports: lamportsToSend,
        signature,
    };
}
async function reclaimSponsoredAccounts() {
    const accounts = await (0, db_1.fetchSponsoredAccountsAndPrivateKey)();
    const reclaimed = [];
    const skipped = [];
    for (const account of accounts) {
        try {
            const result = await reclaimSingleAccount(account);
            if (result.success) {
                reclaimed.push(result);
            }
            else {
                skipped.push(result);
            }
        }
        catch (error) {
            skipped.push({
                account: account.public_key,
                destination: account.owner_public_key ?? "",
                success: false,
                lamports: 0n,
                reason: error?.message ?? "Failed to reclaim account",
            });
        }
    }
    const totalLamports = reclaimed.reduce((sum, result) => sum + result.lamports, 0n);
    return {
        reclaimed,
        skipped,
        totalLamports,
        totalSol: Number(totalLamports) / web3_js_1.LAMPORTS_PER_SOL,
    };
}
