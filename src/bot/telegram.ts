import { Bot } from "grammy";
import { createSystemAccount } from "../services/createAccount";
import config from "../config/config";
import { fetchWalletInfo } from "../services/fetchAccount";
import { Lamports } from "@solana/kit";
import { kora } from "../server";
import { getSponsoredAccounts } from "../utils/db";
import { setTimeout } from "node:timers";
import { getReclaimableAccount } from "../services/getReclaimables";

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
  setTimeout(() => {
    ctx.reply("Fetching All Sponsored Accounts...");
  }, 1200);
  const reclaimables: any = [];
  const baseAccountArray: any = [];
  const accounts = await getSponsoredAccounts();
  console.log(accounts);
  // for (const acc in accounts) {
  //   baseAccountArray.push(acc);
  //   const reclaimables = await getReclaimableAccount();
  // }
  //
  await ctx.reply(
    `There are ${accounts.length} account(s) that can be reclaimed`,
  );
});

kuro.on("message:text", async (ctx) => {
  await ctx.reply("Hey im Kuroscan and i help devs reclaim SOL");
});
