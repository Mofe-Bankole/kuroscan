"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAutoReclaimCycle = runAutoReclaimCycle;
exports.startAutoReclaimScheduler = startAutoReclaimScheduler;
const config_1 = __importDefault(require("../config/config"));
const reclaimService_1 = require("../services/reclaimService");
const telegram_1 = require("../bot/telegram");
const db_1 = require("../utils/db");
const getReclaimables_1 = require("../services/getReclaimables");
const web3_js_1 = require("@solana/web3.js");
/**
 * Runs one auto‑reclaim cycle.
 *
 * 1️⃣  Compute the total SOL currently owed (sum of each account’s
 *     `reclaimableLamports` as returned by `getReclaimableAccount`).
 * 2️⃣  If that total exceeds `config.AUTO_RECLAIM_THRESHOLD_SOL`,
 *     invoke `reclaimSponsoredAccounts()` to perform the batch reclaim.
 * 3️⃣  DM each admin (listed in `config.ADMIN_IDS`) with a short summary.
 */
async function runAutoReclaimCycle() {
    try {
        // ---- 1️⃣ Compute total owed SOL ------------------------------------------------
        const accounts = await (0, db_1.fetchSponsoredAccountsAndPrivateKey)();
        let totalOwedLamports = 0n;
        for (const acct of accounts) {
            const reclaimInfo = await (0, getReclaimables_1.getReclaimableAccount)(acct.public_key);
            if (reclaimInfo.reclaimable) {
                totalOwedLamports += reclaimInfo.reclaimableLamports;
            }
        }
        const totalOwedSol = Number(totalOwedLamports) / web3_js_1.LAMPORTS_PER_SOL;
        // ---- 2️⃣ Threshold check -------------------------------------------------------
        if (totalOwedSol < config_1.default.AUTO_RECLAIM_THRESHOLD_SOL)
            return;
        // ---- 3️⃣ Perform the actual reclaim ------------------------------------------------
        const summary = await (0, reclaimService_1.reclaimSponsoredAccounts)();
        // ---- 4️⃣ Notify admins -----------------------------------------------------------
        const lines = [
            `<b>⚡️ Auto‑Reclaim Triggered</b>`,
            `💸 Owed before reclaim: <code>${totalOwedSol.toFixed(4)} SOL</code>`,
            `✅ Reclaimed accounts: <code>${summary.reclaimed.length}</code>`,
            `💰 Total reclaimed: <code>${summary.totalSol} SOL</code>`,
        ];
        if (summary.skipped.length) {
            lines.push(`⚠️ Skipped / failed: <code>${summary.skipped.length}</code>`);
        }
        const msg = lines.join("\n");
        for (const adminId of config_1.default.ADMIN_IDS) {
            await telegram_1.kuro.api.sendMessage(adminId, msg, { parse_mode: "HTML" });
        }
    }
    catch (err) {
        const errMsg = `🚨 Auto‑reclaim error: ${err?.message ?? "unknown"}`;
        for (const adminId of config_1.default.ADMIN_IDS) {
            await telegram_1.kuro.api.sendMessage(adminId, errMsg);
        }
    }
}
/** Starts the periodic timer. Call once on server start. */
function startAutoReclaimScheduler() {
    // Run immediately on boot
    runAutoReclaimCycle().catch(() => { });
    // Then repeat every configured interval
    setInterval(() => runAutoReclaimCycle().catch(() => { }), config_1.default.AUTO_RECLAIM_CHECK_INTERVAL_MS);
}
