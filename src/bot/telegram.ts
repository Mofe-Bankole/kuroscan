import { Bot } from "grammy"
import { bold, fmt, italic, link } from "@grammyjs/parse-mode"
import config from "../config/config"
import { getAccountInfo, getBalance, getReclaimableAccount } from "../utils/solana";
import { supabase } from "../lib/supabase";
import { addNewAccount } from "../cron/trackAccount";
import { publicKey} from "../sponsorkeypair.json"
import { getSponsoredAccounts, SponsoredAccount } from "../services/getSponsoredAccounts";
// Bot initializer
export const kuro = new Bot(config.BOT_TOKEN);


kuro.command("test", async (ctx) => {
    console.log('Test command was called')
    await ctx.reply("I'm a bot dedicated to helping you reclaim SOL from your expired SOL accounts. I also monitor the Solana Network for all your accounts.");
    await ctx.reply("I know we'll do great things together.");
});

kuro.command("about", async (ctx) => {
    await ctx.reply("Hey I'm Tokito 👋 a bot dedicated to scanning the Kora node for dormant SOL 💰accounts\n\nMy name's based on the Mist Hashira  Muichiro Tokito since I'm pretty fast and reliable 🙂\n\nChat me up to get started")
})

kuro.command("help", async (ctx) => {
    ctx.reply("Here are all my available commands 💨");
    ctx.reply("/test - Test Kuro\n/about - Tells you about Tokito\n/uptime - Check the uptime of Tokito\n/track - Track a Sponsor\n")
    ctx.reply("You can use them by adding a '/' before the command")
})

kuro.command("add", async (ctx) => {
    // if (ctx.message?.text) return;
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    console.log(ctx.message?.text)

    if (!accountPubkey) {
        await ctx.reply("Please provide the account public key 😑. Usage:\n/track <account_public_key>");
        return;
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(accountPubkey)) {
        await ctx.reply("That doesn't look like a valid Solana public key 😑. Please check and try again.");
        return;
    }

    const res = addNewAccount({ address: accountPubkey, sponsor_pubkey: config.SPONSOR_PUBKEY, owner_program: process.env.DEFAULT_OWNER_PROGRAM as string, status: "active" })
    await ctx.reply(`Tracking account: ${accountPubkey}.........`);
    
});

// Fixed fetch command
kuro.command("fetch", async (ctx) => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    if (!accountPubkey) {
        await ctx.reply("Please provide the account public key 😑. Usage:\n/fetch <account_public_key>");
        return;
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(accountPubkey)) {
        await ctx.reply("That doesn't look like a valid Solana public key 😑. Please check and try again. 😝");
        return;
    }

    try {
        const data = await getBalance(accountPubkey);
        const explorerUrl = `https://solscan.io/account/${accountPubkey}?cluster=devnet`
        await ctx.reply(`Balance is ${data} SOL 💰\nSolscan Page ${explorerUrl}`);
    } catch (error) {
        await ctx.reply("Sorry, I couldn't fetch the balance 😅.\nPlease try again later.");
    }
});


kuro.command("stats", async (ctx) => {
    const now = Intl.DateTimeFormat('en-NG', { dateStyle: "medium", timeStyle: "medium" }).format(new Date());
    const accountInfo = await getAccountInfo(publicKey);
    ctx.reply(`💰 Balance ${accountInfo.balance} SOL\n\n👌🏾 Status : ${accountInfo.status}\n\nisSponsor : true\n\n🌐 Explorer URL : ${accountInfo.explorer}\n\nSpace : ${accountInfo.space}`)
    kuro.api.sendMessage(ctx.message?.chat.id || "", `*Stats*\n\n⏲ Time : ${now}`, { parse_mode: "MarkdownV2" })
})


kuro.command("list" , async(ctx) => {
    const data = await getSponsoredAccounts();

    if (typeof data === "string") {
        // This is the "No sponsored accounts found." message or other error string
        await ctx.reply(data);
    } else if (Array.isArray(data) && data.length > 0) {
        let listString = `*🏦 Sponsored Accounts 🏦*\n\n` +
            data.map(
                (acc: {sponsor_pubkey: string, account_pubkey: string}, i: number) =>
                    `${i + 1}.Account: \`${acc.account_pubkey}\` Sponsor: \`${acc.sponsor_pubkey}\`\n`
            ).join("\n\n");

        await ctx.reply(listString, { parse_mode: "Markdown" });
    } else {
        await ctx.reply("No sponsored accounts found.");
    }
    
})

kuro.command("scan", async (ctx) => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    try {
        const data = getAccountInfo(accountPubkey)
        const res = await data;
        await ctx.reply(`Account : ${res.publicKey}\nBalance : ${res.balance?.toFixed(4)}\nExecutable : ${res.executable}\nExplorer URL : ${res.explorer}\nOwner: ${res.owner}\nSystem Account : ${res.isSystemAccount}\nToken Account : ${res.isTokenAccount}\nLamports : ${res.lamports}`)
    } catch (error) {
        console.log(error)
        await ctx.reply(`${error}`)
    }
})

kuro.command("verify" , async ctx => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    try {
        const res = await getReclaimableAccount(accountPubkey);
        ctx.reply(`Recliamable : ${res.reclaimable ? "Yes" : "No"}  ${res.reclaimableLamports} | ${res.reason}  | ${res.rentExemptMinimum} ${res.lamports}`)
    } catch (error) {
        console.error(error)
    }
})

kuro.hears("Whats up?", ctx => {
    ctx.reply("Im doing well brother , just fighting some demons over here 😈")
})

kuro.hears("How are you?"   , ctx =>{
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How are u?" , ctx =>{
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How are you" , ctx =>{
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How r u?" , ctx =>{
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How are u" , ctx =>{
    ctx.reply("Im doing fine wbu?")
})

kuro.on("message:text", (ctx) => {
    if (ctx.message.text.includes("/")) return
    const mssg = ctx.message;
    let reply: string;

    ctx.reply("What are we doing today? 😝")
})





kuro.start();