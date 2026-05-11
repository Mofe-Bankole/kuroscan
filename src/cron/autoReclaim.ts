import config from "../config/config";
import { reclaimSponsoredAccounts } from "../services/reclaimService";
import { kuro } from "../bot/telegram";
import { fetchSponsoredAccountsAndPrivateKey } from "../utils/db";
import { getReclaimableAccount } from "../services/getReclaimables";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Runs one auto‑reclaim cycle.
 *
 * 1️⃣  Compute the total SOL currently owed (sum of each account’s
 *     `reclaimableLamports` as returned by `getReclaimableAccount`).
 * 2️⃣  If that total exceeds `config.AUTO_RECLAIM_THRESHOLD_SOL`,
 *     invoke `reclaimSponsoredAccounts()` to perform the batch reclaim.
 * 3️⃣  DM each admin (listed in `config.ADMIN_IDS`) with a short summary.
 */
export async function runAutoReclaimCycle(): Promise<void> {
  try {
    // ---- 1️⃣ Compute total owed SOL ------------------------------------------------
    const accounts = await fetchSponsoredAccountsAndPrivateKey();

    let totalOwedLamports = 0n;
    for (const acct of accounts) {
      const reclaimInfo = await getReclaimableAccount(acct.public_key);
      if (reclaimInfo.reclaimable) {
        totalOwedLamports += reclaimInfo.reclaimableLamports;
      }
    }
    const totalOwedSol = Number(totalOwedLamports) / LAMPORTS_PER_SOL;

    // ---- 2️⃣ Threshold check -------------------------------------------------------
    if (totalOwedSol < config.AUTO_RECLAIM_THRESHOLD_SOL) return;

    // ---- 3️⃣ Perform the actual reclaim ------------------------------------------------
    const summary = await reclaimSponsoredAccounts();

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
    for (const adminId of config.ADMIN_IDS) {
      await kuro.api.sendMessage(adminId, msg, { parse_mode: "HTML" });
    }
  } catch (err: any) {
    const errMsg = `🚨 Auto‑reclaim error: ${err?.message ?? "unknown"}`;
    for (const adminId of config.ADMIN_IDS) {
      await kuro.api.sendMessage(adminId, errMsg);
    }
  }
}

/** Starts the periodic timer. Call once on server start. */
export function startAutoReclaimScheduler(): void {
  // Run immediately on boot
  runAutoReclaimCycle().catch(() => {});
  // Then repeat every configured interval
  setInterval(
    () => runAutoReclaimCycle().catch(() => {}),
    config.AUTO_RECLAIM_CHECK_INTERVAL_MS,
  );
}
