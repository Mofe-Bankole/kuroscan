import { Bot } from "grammy";
import { createSystemAccount } from "../services/createAccount";
import { OpenRouter } from "@openrouter/sdk";
import { AIResponse } from "../utils/types";
import config from "../config/config";
import { supabase } from "../lib/supabase";

// Bot initializer
export const kuro = new Bot(config.BOT_TOKEN);

export const ai = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

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
Never add exclamation marks to your responses as this would stop the framework from returning the markdownnot
Do not reveal your reasoning, thinking process as a response`;

async function returnMessage(msg: string): Promise<AIResponse> {
  try {
    const body = await ai.chat.send({
      model: "tnvidia/nemotron-3-nano-30b-a3b:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: msg,
        },
      ],
      stream: false,
    });

    return {
      res: body.choices[0].message.content as string,
      err: null,
    };
  } catch (error) {
    return {
      res: "Hello ",
      err: error as string,
    };
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
      `/fetch - Fetch an accounts info\n`+
      `/zombie - Create a Zombie Account`
  );
});

/**Create A Zombie account */
kuro.command("zombie" , async(ctx) => {
    await ctx.reply("Creating a Zombie Account.....");
    const account_data = await createSystemAccount()
    if(!account_data.success){
      await ctx.reply(`Failed to Create Zombie ${account_data.error} `)
    }
    await kuro.api.sendMessage(ctx.chatId , `Created Zombie Account/nAccount Pubkey : ${account_data.accountPubkey}/n/nPrivate Key : ${account_data.accountPrivateKey}/n/nExplorer URL`, {parse_mode : "HTML"})
    await ctx.reply("Zombie Account has been created")
})

kuro.command("reclaim" , async(ctx) => {
  await ctx.reply("Reclaiming Rent...")
  const accounts = await supabase.from("sponsored_accounts").select("*")
  console.log(accounts)
})

kuro.on("message:text", async(ctx) => {
  await ctx.reply("Hey im Kuroscan and i help devs reclaim SOL");
})