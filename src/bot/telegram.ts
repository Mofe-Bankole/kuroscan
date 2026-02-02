import { Bot, InlineKeyboard, InputFile } from "grammy";
import config from "../config/config";
import { getAccountInfo } from "../utils/solana";
import { addNewAccount } from "../cron/trackAccount";
import { publicKey } from "../sponsorkeypair.json";

import { getReclaimableAccount } from "../services/getReclaimables";
import { createSystemAccount } from "../services/createAccount";
import { reclaimSystemAccount } from "../services/reclaimService";
import { getSponsoredAccounts, storeUser } from "../utils/db";
import {OpenRouter} from "@openrouter/sdk"
import { generateStatCard } from "../utils/canvas";
// Bot initializer
export const kuro = new Bot(config.BOT_TOKEN);

export const ai = new OpenRouter({
  apiKey : process.env.OPENROUTER_API_KEY,
})

const SYSTEM_PROMPT = `You are Mui_scan a Telegram bot built to help developers scan, verify, and reclaim rent from Solana accounts.
You operate on Kora Nodes and are designed to be fast, reliable, and precise, just like the Mist Hashira you’re named after.

Your tone is friendly, confident, and helpful. Keep responses short and clear (2–4 lines max when possible).
Use appropriate emojis to keep conversations engaging, but never overdo it.

Your primary focus is Solana, Web3, and rent reclamation.
If the user briefly strays into normal conversation, respond politely and casually — but switch back to developer mode immediately once Solana or Web3 topics come up.

Do not stress about being perfect. You are already doing great. Stay helpful, calm, and developer-focused.

Available Commands:

stats — View total sponsored rent, reclaimed SOL, and active accounts

accounts — List accounts sponsored by this Kora Node

scan — Run a rent scan

idle — Show accounts eligible for rent reclaim

verify — Check if an account is reclaimable and show its details

reclaim — Manually reclaim rent from eligible accounts

list — List all sponsored accounts

create — Create a new sponsored account

help — Usage instructions and safety info

Always prioritize accuracy, safety, and clarity when handling user actions.
Never add exclamation marks to your responses as this would stop the framework from returning the markdown`

export type AIResponse = {
  res : string,
  err : string | null,
}

async function returnMessage(msg : string) : Promise<AIResponse>{
  try {
    
  const body = await ai.chat.send({
    model : "stepfun/step-3.5-flash:free",
    messages: [
      {role : "system" , content : SYSTEM_PROMPT},
      {
        role: 'user',
        content: msg,
      },
    ],
    stream: false,
  })

  return {
    res : body.choices[0].message.content as string,
    err : null,
  }
 } catch (error) {
    return{
      res : "No response from the AI",
      err : error as string,
    }
  }
}

kuro.command("start", async (ctx) => {
  await ctx.reply(
    "Hey I'm Tokito 👋 a bot dedicated to scanning the Kora node for dormant SOL 💰accounts\n\nMy name's based on the Mist Hashira  Muichiro Tokito since I'm pretty fast and reliable 🙂\n\nChat me up to get started",
  );
});

kuro.command("help", async (ctx) => {
  await ctx.reply("Here are all my available commands 💨");
  await ctx.reply(
    `/about - Tells you about Tokito\n` +
    `/add - Add a new sponsored account to track\n` +
    `/stats - Status of your sponsor / Kora Node\n` +
    `/list - List all sponsored accounts\n` +
    `/verify - Verify if an account is reclaimable\n` +
    `/create - Create a new sponsored account / System Program account\n` +
    `/fetch - Fetch an accounts info\n`,
  );
});

kuro.command("add", async (ctx) => {
  // if (ctx.message?.text) return;
  const messageText = ctx.message?.text || "";
  const parts = messageText.split(" ");
  const accountPubkey = parts[1];

  if (!accountPubkey) {
    await ctx.reply(
      "Please provide the account public key 😑. Usage:\n/track <account_public_key>",
    );
    return;
  }

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(accountPubkey)) {
    await ctx.reply(
      "That doesn't look like a valid Solana public key 😑. Please check and try again.",
    );
    return;
  }

  try {
    const res = await addNewAccount({
      address: accountPubkey,
      sponsor_pubkey: config.SPONSOR_PUBKEY,
      owner_program: process.env.DEFAULT_OWNER_PROGRAM as string,
      status: "active",
    });

    if (res) {
      await ctx.reply(`✅ Successfully tracking account: ${accountPubkey}`);
    } else {
      await ctx.reply(
        `❌ Failed to track account. It may already exist in the database.`,
      );
    }
  } catch (error: any) {
    await ctx.reply(`❌ Error tracking account: ${error.message}`);
  }
});

kuro.command("stats", async (ctx) => {
  const accountInfo = await getAccountInfo(publicKey);
  await ctx.react("👌");
  await ctx.reply("Fetching Sponsor stats.......");
  ctx.reply(
    `💰 Balance ${accountInfo.balance} SOL\n\n` +
    `ℹ️ Status : ${accountInfo.status}\n\n` +
    `isSponsor : true\n\n` +
    `🌐 Explorer URL : ${accountInfo.explorer}\n\n
    `,
  );
});




// List command
kuro.command("list", async (ctx) => {
  await ctx.reply(`Fetching all sponsored accounts............⏳`);
  const data = await getSponsoredAccounts();

  if (!data || data.length === 0) {
    await ctx.reply(`No accounts ❌` + `\n\nUse /create to create a new account`);
    await kuro.api.sendMessage(ctx.chat.id, `Then visit <a href="https://faucet.solana.com">Solana Faucet</a> to fund your newly created wallet...`, { parse_mode: "HTML" });
  }

  data.forEach((acc: any) => {
    ctx.reply(
      `
            🔐 Account PublicKey : ${acc.public_key}\n` +
      `\nℹ️ Status : ${acc.status}\n\n` +
      `Explorer URL  : https://solscan.io/account/${acc.public_key}?cluster=devnet\n`,
    );
  });
});




kuro.command("fetch", async (ctx) => {
  const messageText = ctx.message?.text || "";
  const parts = messageText.split(" ");
  const accountPubkey = parts[1];

  try {
    const res = await getAccountInfo(accountPubkey);

    if (!res || !res.exists) {
      await ctx.reply(
        "Account Not Found ❌\n\nPlease retry with a confirmed public key",
      );
      return;
    }

    await kuro.api.sendMessage(
      ctx.chat.id,
      `
        <b>Account Info</b>
        <i>Balance : ${res.balance?.toFixed(4) || 0} SOL</i>
        <b>Executable : ${res.executable} </b>
        <a href="${res.explorer || "#"}" target="_blank">Explorer URL</a>
        <b>Owner : ${res.owner || "Unknown"} </b>
        <b>System Account : ${res.isSystemAccount}</b>
        <b>Token Account : ${res.isTokenAccount}</b>
        <b>Lamports : ${res.lamports?.toString() || "0"}</b>
        <b>Status : ${res.status}</b>`,
      { parse_mode: "HTML" },
    );
   const img = await generateStatCard(res)
   await ctx.replyWithPhoto(new InputFile(img.path));
    // generateDegenCard()
  } catch (error: any) {
    console.log(error);
    await ctx.reply(`❌ Error: ${error.message || String(error)}`);
  }
});

kuro.command("verify", async (ctx) => {
  const messageText = ctx.message?.text || "";
  const parts = messageText.split(" ");
  const accountPubkey = parts[1];

  if (!accountPubkey) {
    await ctx.reply(
      "Please provide an account public key. Usage:\n/verify <account_public_key>",
    );
    return;
  }

  try {
    const res = await getReclaimableAccount(accountPubkey);
    if (!res) {
      await ctx.reply("Error Verifying Account. Please Try Again");
      return;
    }

    const reclaimableAmount = res.reclaimableLamports
      ? (Number(res.reclaimableLamports) / 1000000000).toFixed(6)
      : "0";

    await ctx.reply(
      `🔍 Account Verification\n\n` +
      `📍 Account: ${accountPubkey}\n\n` +
      `♻️ Reclaimable: ${res.reclaimable ? "✅ Yes" : "❌ No"}\n\n` +
      `ℹ️ Status: ${res.status}\n\n` +
      `❓ Reason: ${res.reason}\n\n` +
      `💰 Reclaimable Amount: ${reclaimableAmount} SOL\n\n` +
      `🪙 Lamports: ${res.lamports?.toString() || "0"}\n\n` +
      `📦 System Account: ${res.isSystemAccount ? "Yes" : "No"}`,
    );
    await ctx.reply(
      `ℹ️ To reclaim this account\n\n` +
      `Use the reclaim command : /reclaim <account_public_key>\n`,
    );
  } catch (error: any) {
    console.error(error);
    await ctx.reply(`❌ Error: ${error.message || String(error)}`);
  }
});

kuro.command("reclaim", async (ctx) => {
  const messageText = ctx.message?.text || "";
  const parts = messageText.split(" ");
  const accountPubkey = parts[1];

  if (!accountPubkey) {
    await ctx.reply(
      "Please provide an account public key.\n\nUsage:\n/reclaim <account_public_key>",
    );
    return;
  }

  try {
    await ctx.reply("Attempting to reclaim rent.......⏳");
    const result = await reclaimSystemAccount(accountPubkey);

    if (result.success) {
      await ctx.reply(
        `✅ Reclaim Successful!\n\n` +
        `💰 Reclaimed: ${result.amount.toFixed(6)} SOL\n` +
        `🔗 Transaction: ${result.explorerURL}\n\n` +
        `The reclaimed SOL has been sent to the operator treasury.`,
      );
    } else {
      await ctx.reply(
        `❌ Reclaim Failed\n\n` +
        `Reason: ${result.error}\n\n` +
        `🔗 Account: ${result.explorerURL}\n\n` +
        `💡 Note: To reclaim rent, you need to own the account or be the close authority.\n\n` +
        `Use /create to make test accounts you can reclaim.\n`,
      );
    }
  } catch (error: any) {
    console.error(error);
    await ctx.reply(`Unable to execute reclaim\n\n.Please try again`)
  }
});

kuro.command("create", async (ctx) => {
  try {
    await ctx.reply("Creating a new system account... ⏳");

    const newAccount = await createSystemAccount();

    if (!newAccount || !newAccount.success) {
      await ctx.reply(
        `❌ Failed to create account: ${newAccount?.error || "Unknown error"}`,
      );
      return;
    }

    await ctx.reply(
      `✅ Account Created Successfully!\n\n` +
      `📍 Account Address : ${newAccount.accountPubkey}\n\n` +
      `⛓️ Explorer: ${newAccount.explorerURL}\n\n` +
      `💰 Initial Balance: ${newAccount.initialBalance} SOL\n\n` +
      `This account is now tracked. You can reclaim rent from it later using:\n` +
      `/reclaim ${newAccount.accountPubkey}`,
    );
    await kuro.api.sendMessage(ctx.chat.id, `<i>You can get all the accounts you have added earlier using /list</i>`, { parse_mode: "HTML" })
    await kuro.api.sendMessage(ctx.chat.id, `Visit <a href="https://faucet.solana.com">Solana Faucet</a> to fund your newly created wallet`, { parse_mode: "HTML" });
  } catch (error: any) {
    console.error(error);
    await ctx.reply(`❌ Error: ${error.message || String(error)}`);
  }
});

kuro.on("message:text", async(ctx) => {
  if (ctx.message.text.includes("/")) return;
  const mssg = ctx.message;
  let reply: string;
  const msg = await returnMessage(mssg.text)
  // await kuro.api.sendMessage(ctx.chat.id , `${msg.res}` ,{ parse_mode : "MarkdownV2"})
  ctx.reply(msg.res)
});



