import { Bot, type Context } from "grammy";
import config from "../config/config";
import { fetchWalletInfo } from "../services/fetchAccount";
import { Lamports } from "@solana/kit";
import { reclaimSponsoredAccounts } from "../services/reclaimService";
import { kora } from "../lib/koraClient";
import {
  fetchSponsoredAccountsNumber,
  getSponsoredAccounts,
} from "../utils/db";
import { handleZombie } from "../helpers/handleZombie.helper";
import { getReclaimableAccount } from "../services/getReclaimables";

export const kuro = new Bot(config.BOT_TOKEN);

function lamportsToSol(lamports: Lamports | bigint | number | undefined) {
  if (lamports === undefined) return "0";
  const v = typeof lamports === "bigint" ? lamports : BigInt(String(lamports));
  return (Number(v) / 1e9).toFixed(6);
}

function parseZombieBatchCount(text: string): number | null {
  const parts = text.trim().split(/\s+/);
  const nRaw = parts[1];
  if (nRaw === undefined) return 1;
  const parsed = Number.parseInt(nRaw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) return null;
  return parsed;
}

async function runZombieBatch(ctx: Context, count: number) {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) {
    await ctx.reply("Could not resolve chat id for this update.");
    return;
  }

  await ctx.reply(`Creating ${count} zombie account(s) on devnet…`);

  for (let i = 0; i < count; i++) {
    const zombie = await handleZombie();

    if (zombie.error || !zombie.account) {
      await ctx.reply(
        `Failed (batch ${i + 1}/${count}): ${zombie.error ?? "unknown error"}`,
      );
      return;
    }

    const acc = zombie.account;
    await kuro.api.sendMessage(
      chatId,
      `<b>Created zombie account</b> (${i + 1}/${count})\n\n` +
        `<b>Pubkey</b>\n<code>${acc.accountPubkey}</code>\n\n` +
        `<b>Explorer</b>\n<a href="${acc.explorerURL}">${acc.explorerURL}</a>\n\n` +
        `<b>Network</b>: devnet\n` +
        `<b>Tx</b>\n<code>${acc.signature}</code>`,
      { parse_mode: "HTML" },
    );
  }

  await ctx.reply(
    "Done. Secret keys are stored in Supabase for this bot instance — treat that database as highly sensitive.",
  );
}

kuro.command("start", async (ctx) => {
  await ctx.reply(
    "Hey, I'm Tokito — a Telegram operator for Kuroscan.\n\n" +
      "I help you spin up sponsored-style system accounts on Solana devnet and sweep **excess SOL** back to your sponsor safely (without draining rent-exempt minimums).\n\n" +
      "Type /help for commands.",
    { parse_mode: "Markdown" },
  );
});

kuro.command("stats", async (ctx) => {
  try {
    const rows = (await fetchSponsoredAccountsNumber()) ?? [];
    const reclaimed = rows.filter((r) => r.status === "reclaimed").length;
    const active = rows.filter((r) => r.status === "active").length;
    const sponsors = (await kora.getConfig()).fee_payers;
    const date = new Date().toUTCString();

    await kuro.api.sendMessage(
      ctx.chat.id,
      `<b>Kuroscan stats</b> <i>${date}</i>\n\n` +
        `Tracked in DB: <b>${rows.length}</b>\n` +
        `Active: <b>${active}</b>\n` +
        `Marked reclaimed: <b>${reclaimed}</b>\n\n` +
        `<b>Kora fee payers</b>\n<pre>${JSON.stringify(sponsors, null, 2)}</pre>`,
      { parse_mode: "HTML" },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await ctx.reply(`Stats unavailable: ${msg}`);
  }
});

kuro.command("help", async (ctx) => {
  await ctx.reply(
    `/about — what Kuroscan is (hackathon blurb)\n` +
      `/stats — DB + Kora node snapshot\n` +
      `/list — public keys tracked for this bot (max 25)\n` +
      `/verify &lt;pubkey&gt; — reclaim pre-check (rent-aware)\n` +
      `/fetch &lt;pubkey&gt; — quick on-chain read\n` +
      `/create — same as /zombie (README compatibility)\n` +
      `/zombie — create one devnet system account\n` +
      `/zombie 3 — create up to 10 accounts in one go\n` +
      `/reclaim — sweep reclaimable excess to sponsor\n\n` +
      `Phrases: “Create a Zombie Account”, “Reclaim all owed rent”.`,
    { parse_mode: "HTML" },
  );
});

kuro.command("about", async (ctx) => {
  await ctx.reply(
    "<b>Kuroscan</b> is a devnet workflow bot: provision empty system accounts, persist their keys in your Supabase, and reclaim <i>only lamports above rent-exempt minimum</i> so accounts are not accidentally bricked.\n\n" +
      "Stack: Grammy + Express health API + <code>@solana/kora</code> for sponsor visibility + Supabase for bookkeeping.\n\n" +
      "Built for Solana Colosseum — automate the boring part of sponsored account hygiene.",
    { parse_mode: "HTML" },
  );
});

kuro.command("list", async (ctx) => {
  try {
    const rows = (await getSponsoredAccounts()) ?? [];
    if (!rows.length) {
      await ctx.reply("No sponsored accounts in the database yet.");
      return;
    }
    const slice = rows.slice(0, 25);
    const lines = slice.map(
      (r) => `• <code>${r.public_key}</code> — ${r.status}`,
    );
    const more =
      rows.length > slice.length
        ? `\n\n… and <b>${rows.length - slice.length}</b> more not shown.`
        : "";
    await kuro.api.sendMessage(
      ctx.chat.id,
      `<b>Tracked accounts (${rows.length})</b>\n\n${lines.join("\n")}${more}`,
      { parse_mode: "HTML" },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await ctx.reply(`Could not list accounts: ${msg}`);
  }
});

kuro.command("verify", async (ctx) => {
  const parts = ctx.msg.text.trim().split(/\s+/);
  const pubkey = parts[1];
  if (!pubkey) {
    await ctx.reply("Usage: /verify <public_key>");
    return;
  }

  try {
    const info = await getReclaimableAccount(pubkey);
    const rent =
      info.rentExemptMinimum !== null && info.rentExemptMinimum !== undefined
        ? `${info.rentExemptMinimum} lamports`
        : "n/a";
    const lam =
      info.lamports !== null && info.lamports !== undefined
        ? `${info.lamports} lamports (~${lamportsToSol(info.lamports)} SOL)`
        : "n/a";

    await kuro.api.sendMessage(
      ctx.chat.id,
      `<b>Verify</b> <code>${pubkey}</code>\n\n` +
        `<b>Reclaimable:</b> ${info.reclaimable ? "yes" : "no"}\n` +
        `<b>Reason:</b> ${info.reason}\n` +
        `<b>System account:</b> ${info.isSystemAccount}\n` +
        `<b>Balance:</b> ${lam}\n` +
        `<b>Rent-exempt min:</b> ${rent}\n` +
        `<b>Reclaimable lamports (excess):</b> ${info.reclaimableLamports}`,
      { parse_mode: "HTML" },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await ctx.reply(`Verify failed: ${msg}`);
  }
});

kuro.command("create", async (ctx) => {
  const count = parseZombieBatchCount(ctx.msg.text ?? "");
  if (count === null) {
    await ctx.reply(
      "Usage: /create — one account\n/create <n> — n accounts (1–10). Same behavior as /zombie.",
    );
    return;
  }
  await runZombieBatch(ctx, count);
});

kuro.command("zombie", async (ctx) => {
  const count = parseZombieBatchCount(ctx.msg.text ?? "");
  if (count === null) {
    await ctx.reply(
      "Usage: /zombie — create one account\n/zombie <n> — create n accounts (1–10)",
    );
    return;
  }
  await runZombieBatch(ctx, count);
});

kuro.hears("Create a Zombie Account", async (ctx) => {
  await ctx.reply("Creating a zombie account on devnet…");

  const zombie = await handleZombie();

  if (zombie.error || !zombie.account) {
    await ctx.reply(
      `Failed to create zombie account: ${zombie.error ?? "unknown error"}`,
    );
    return;
  }

  const acc = zombie.account;
  const chatId = ctx.chat?.id;
  if (chatId === undefined) {
    await ctx.reply("Could not resolve chat id for this update.");
    return;
  }
  await kuro.api.sendMessage(
    chatId,
    `<b>Created zombie account</b>\n\n` +
      `<b>Pubkey</b>\n<code>${acc.accountPubkey}</code>\n\n` +
      `<b>Explorer</b>\n<a href="${acc.explorerURL}">${acc.explorerURL}</a>\n\n` +
      `<b>Network</b>: devnet`,
    { parse_mode: "HTML" },
  );
  await ctx.reply(
    "Private key material was written to Supabase for this deployment.",
  );
});

kuro.command("fetch", async (ctx) => {
  const parts = ctx.msg.text.trim().split(/\s+/);
  const walletaddr = parts[1];

  if (!walletaddr) {
    await ctx.reply("Usage: /fetch <public_key>");
    return;
  }

  const accountINFO = await fetchWalletInfo(walletaddr);
  if (!accountINFO) {
    await ctx.reply("Invalid public key or account not found.");
    return;
  }

  await kuro.api.sendMessage(
    ctx.chat.id,
    `<b>Account</b>\n` +
      `Public key: <code>${walletaddr}</code>\n` +
      `Balance: <b>${lamportsToSol(accountINFO.balance as Lamports)} SOL</b>\n` +
      `Owner: <code>${String(accountINFO.owner ?? "")}</code>\n` +
      `Executable: <b>${accountINFO.executable ? "yes" : "no"}</b>\n` +
      `<a href="${accountINFO.explorerUrl}">Solscan</a>`,
    { parse_mode: "HTML" },
  );
});

kuro.command("reclaim", async (ctx) => {
  await ctx.reply(
    "Fetching sponsored accounts and reclaimable balances (rent-aware)…",
  );

  try {
    const summary = await reclaimSponsoredAccounts();

    if (summary.reclaimed.length === 0 && summary.skipped.length === 0) {
      await ctx.reply("No sponsored accounts were found in the database.");
      return;
    }

    const lines = [
      `<b>Reclaim summary</b>`,
      ``,
      `<b>Reclaimed:</b> ${summary.reclaimed.length}`,
      `<b>Total moved:</b> ${summary.totalSol.toFixed(6)} SOL`,
    ];

    if (summary.reclaimed.length > 0) {
      lines.push(
        "",
        ...summary.reclaimed.map(
          (item) =>
            `• <code>${item.account}</code>\nTo: <code>${item.destination}</code>\nSig: <code>${item.signature}</code>`,
        ),
      );
    }

    if (summary.skipped.length > 0) {
      lines.push(
        "",
        `<b>Skipped / failed:</b> ${summary.skipped.length}`,
        ...summary.skipped.map(
          (item) =>
            `• <code>${item.account}</code> — ${item.reason ?? "skipped"}`,
        ),
      );
    }

    await kuro.api.sendMessage(ctx.chat.id, lines.join("\n"), {
      parse_mode: "HTML",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await ctx.reply(`Reclaim failed: ${msg}`);
  }
});

kuro.hears("Reclaim all owed rent", async (ctx) => {
  await ctx.reply(
    "Fetching sponsored accounts and reclaimable balances (rent-aware)…",
  );

  try {
    const summary = await reclaimSponsoredAccounts();

    if (summary.reclaimed.length === 0 && summary.skipped.length === 0) {
      await ctx.reply("No sponsored accounts were found in the database.");
      return;
    }

    const lines = [
      `<b>Reclaim summary</b>`,
      ``,
      `<b>Reclaimed:</b> ${summary.reclaimed.length}`,
      `<b>Total moved:</b> ${summary.totalSol.toFixed(6)} SOL`,
    ];

    if (summary.reclaimed.length > 0) {
      lines.push(
        "",
        ...summary.reclaimed.map(
          (item) =>
            `• <code>${item.account}</code>\nTo: <code>${item.destination}</code>\nSig: <code>${item.signature}</code>`,
        ),
      );
    }

    if (summary.skipped.length > 0) {
      lines.push(
        "",
        `<b>Skipped / failed:</b> ${summary.skipped.length}`,
        ...summary.skipped.map(
          (item) =>
            `• <code>${item.account}</code> — ${item.reason ?? "skipped"}`,
        ),
      );
    }

    await kuro.api.sendMessage(ctx.chat.id, lines.join("\n"), {
      parse_mode: "HTML",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await ctx.reply(`Reclaim failed: ${msg}`);
  }
});

kuro.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;
  await ctx.reply(
    "I did not understand that. Try /help — or say “Create a Zombie Account” / “Reclaim all owed rent”.",
  );
});
