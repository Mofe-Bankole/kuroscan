import { Bot } from "grammy";
import { createSystemAccount } from "../services/createAccount";
import config from "../config/config";
import { fetchWalletInfo } from "../services/fetchAccount";
import { Lamports } from "@solana/kit";
import { reclaimSponsoredAccounts } from "../services/reclaimService";

// Bot initializer
export const kuro = new Bot(config.BOT_TOKEN);

kuro.command("start", async (ctx) => {
  await ctx.reply(
    "Hey I'm Tokito 👋 a bot dedicated to scanning the Kora node for dormant SOL 💰accounts\n\nMy name's based on the Mist Hashira  Muichiro Tokito since I'm pretty fast and reliable 🙂\n\nChat me up to get started",
  );
  await kuro.api.sendMessage(
    ctx.chat.id,
    `**Here are the things i can do**:` +
      `Fetch Stats : Say 'Fetch my Kora Node Stats' or type **/stats**` +
      `Create Zombie Account : Say 'Create a Zombie Account' or type **/zombie**`,
    {
      parse_mode: "MarkdownV2",
    },
  );
});

kuro.command("stats", async (ctx) => {});
kuro.command("help", async (ctx) => {
  await ctx.reply("Here are all my available commands 💨");
  await ctx.reply(
    `/about - Tells you about Tokito\n` +
      `/add - Add a new sponsored account to track\n` +
      `/stats - Status of your sponsor / Kora Node\n` +
      `/list - List all sponsored accounts\n` +
      `/verify - Verify if an account is reclaimable\n` +
      `/fetch - Fetch an accounts info\n` +
      `/zombie - Create a Zombie Account`,
  );
});

/**Create A Zombie account */

kuro.hears("Create a Zombie Account", async (ctx) => {
  await ctx.reply("Creating a Zombie Account.....");
  const account_data = await createSystemAccount();
  if (!account_data.success) {
    await ctx.reply(`Failed to Create Zombie ${account_data.error} `);
  }
  await kuro.api.sendMessage(
    ctx.chatId,
    `<b>Created Zombie Account</b>\n\n<b>Account Details Below</b>\n\n<b>Account Pubkey :</b> <code>${account_data.accountPubkey.toString()}</code>\n\n<b>Explorer URL :</b> <a href="${account_data.explorerURL}">${account_data.explorerURL}</a>\n\n<b>Network :</b> Devnet`,
    { parse_mode: "HTML" },
  );
  await ctx.reply(`Private Key Has Been Persisted in Supabase`);
  await ctx.reply("Zombie Account has been created Successfully");
});

kuro.command("zombie", async (ctx) => {
  await ctx.reply("Creating a Zombie Account.....");
  const account_data = await createSystemAccount();
  if (!account_data.success) {
    await ctx.reply(`Failed to Create Zombie ${account_data.error} `);
  }
  await kuro.api.sendMessage(
    ctx.chatId,
    `<b>Created Zombie Account</b>\n\n<b>Account Details Below</b>\n\n<b>Account Pubkey :</b> <code>${account_data.accountPubkey.toString()}</code>\n\n<b>Explorer URL :</b> <a href="${account_data.explorerURL}">${account_data.explorerURL}</a>\n\n<b>Network :</b> Devnet`,
    { parse_mode: "HTML" },
  );
  await ctx.reply(`Private Key Has Been Persisted in Supabase`);
  await ctx.reply("Zombie Account has been created Successfully");
});

kuro.command("fetch", async (ctx) => {
  const msg = ctx.msg.text;
  // Get the second argument (word) supplied via text
  const parts = msg.split(" ");
  const walletaddr = parts[1];

  const accountINFO = await fetchWalletInfo(walletaddr);

  await kuro.api.sendMessage(
    ctx.chat.id,
    `<b>Account Info</b>\n\nPublicKey : <code>${walletaddr}</code>\n\nBalance : <b>${(accountINFO?.balance as Lamports) / 1000000000n} SOL</b>`,
    { parse_mode: "HTML" },
  );
});

kuro.command("reclaim", async (ctx) => {
  await ctx.reply("Fetching your sponsored accounts and reclaimable balances...");

  try {
    const summary = await reclaimSponsoredAccounts();

    if (summary.reclaimed.length === 0 && summary.skipped.length === 0) {
      await ctx.reply("No sponsored accounts were found.");
      return;
    }

    const lines = [
      `<b>Reclaim Summary</b>`,
      ``,
      `<b>Reclaimed Accounts:</b> ${summary.reclaimed.length}`,
      `<b>Total Reclaimed:</b> ${summary.totalSol} SOL`,
    ];

    if (summary.reclaimed.length > 0) {
      lines.push(
        "",
        ...summary.reclaimed.map(
          (item) =>
            `• <code>${item.account}</code>\nTo: <code>${item.destination}</code>\nSignature: <code>${item.signature}</code>`,
        ),
      );
    }

    if (summary.skipped.length > 0) {
      lines.push(
        "",
        `<b>Skipped / Failed:</b> ${summary.skipped.length}`,
        ...summary.skipped.map(
          (item) =>
            `• <code>${item.account}</code> - ${item.reason ?? "Skipped"}`,
        ),
      );
    }

    await kuro.api.sendMessage(ctx.chat.id, lines.join("\n"), {
      parse_mode: "HTML",
    });
  } catch (error: any) {
    await ctx.reply(`Reclaim failed: ${error?.message ?? "Unknown error"}`);
  }
});

kuro.on("message:text", async (ctx) => {
  await ctx.reply("Hey im Kuroscan and i help devs reclaim SOL");
});
