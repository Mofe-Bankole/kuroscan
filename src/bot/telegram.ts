import { Bot, InlineKeyboard } from "grammy";
import config from "../config/config";
import { getAccountInfo } from "../utils/solana";
import { addNewAccount } from "../cron/trackAccount";
import { publicKey } from "../sponsorkeypair.json";
import { getSponsoredAccounts } from "../services/getSponsoredAccounts";
import { getReclaimableAccount } from "../services/getReclaimables";
import { createSystemAccount } from "../services/createAccount";
import { reclaimSystemAccount } from "../services/reclaimService";
import { storeUser } from "../utils/db";
// Bot initializer
export const kuro = new Bot(config.BOT_TOKEN);


kuro.command("start", async (ctx) => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const account_pubkey = parts[1];
    // console.log(ctx.message?.from.id)
    const save = await storeUser(ctx.message?.from.id as number);
    if(!save) { console.error("Unable to save user")}
    
    if (!account_pubkey) {
        await ctx.reply(`❌ Please provide a sponsor publick key\n\n` + `ℹ️ Usage /start <account_public_key>`);
        return
    }

    await ctx.reply(`The account pubkey provided above will be set as your new acount\n\n` + `Please do not forget this publick key`);
    const inlineKeyboard = new InlineKeyboard()
        .text("Yes", "yes_btn").text("No","no-btn");
    await ctx.reply("Set this account as your new sponsor?", {
        reply_markup: inlineKeyboard
    });

});


kuro.callbackQuery("yes_btn" ,async ctx => {
    await ctx.reply("This is your new sponsor")
})

kuro.command("about", async (ctx) => {
    await ctx.reply("Hey I'm Tokito 👋 a bot dedicated to scanning the Kora node for dormant SOL 💰accounts\n\nMy name's based on the Mist Hashira  Muichiro Tokito since I'm pretty fast and reliable 🙂\n\nChat me up to get started")
})

kuro.command("help", async (ctx) => {
   await  ctx.reply("Here are all my available commands 💨");
    await ctx.reply(
        `/about - Tells you about Tokito\n` 
        + `/add - Add a new sponsored account to track\n` 
        + `/stats - Status of your sponsor / Kora Node\n`
        +  `/list - List all sponsored accounts\n`
        + `/verify - Verify if an account is reclaimable\n`
        + `/create - Create a new sponsored account / System Program account\n`
        + `/fetch - Fetch an accounts info\n` 
    )
})

kuro.command("add", async (ctx) => {
    // if (ctx.message?.text) return;
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    if (!accountPubkey) {
        await ctx.reply("Please provide the account public key 😑. Usage:\n/track <account_public_key>");
        return;
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(accountPubkey)) {
        await ctx.reply("That doesn't look like a valid Solana public key 😑. Please check and try again.");
        return;
    }

    try {
        const res = await addNewAccount({ address: accountPubkey, sponsor_pubkey: config.SPONSOR_PUBKEY, owner_program: process.env.DEFAULT_OWNER_PROGRAM as string, status: "active" });
        if (res) {
            await ctx.reply(`✅ Successfully tracking account: ${accountPubkey}`);
        } else {
            await ctx.reply(`❌ Failed to track account. It may already exist in the database.`);
        }
    } catch (error: any) {
        await ctx.reply(`❌ Error tracking account: ${error.message}`);
    }

});


kuro.command("stats", async (ctx) => {
    const accountInfo = await getAccountInfo(publicKey);
    await ctx.react("👌")
    await ctx.reply("Fetching Sponsor stats.......")
    ctx.reply(`
        💰 Balance ${accountInfo.balance} SOL\n\n` 
        + `ℹ️ Status : ${accountInfo.status}\n\n` 
        + `isSponsor : true\n\n` 
        + `🌐 Explorer URL : ${accountInfo.explorer}\n\n
        `)
})



// List command 
kuro.command("list", async (ctx) => {
    await ctx.reply(`Fetching all sponsored accounts............⏳`)
    const data = await getSponsoredAccounts();

    if (typeof data === "string") {
        // This is the "No sponsored accounts found." message or other error string
        await ctx.reply(data);
    } else if (Array.isArray(data) && data.length > 0) {
        
        data.forEach(acc => {
            ctx.reply(`💳 Account : ${acc.account_pubkey}\n\n` + `💳 Sponsor : ${acc.sponsor_pubkey}`)
        })
    } else {
        await ctx.reply("No sponsored accounts found.");
    }

})

kuro.command("fetch", async (ctx) => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    try {
        const res = await getAccountInfo(accountPubkey);

        if (!res || !res.exists) {
            await ctx.reply("Account Not Found ❌\n\nPlease retry with a confirmed public key");
            return;
        }

        await kuro.api.sendMessage(ctx.chat.id, `
        <b>Account Info</b>
        <i>Balance : ${res.balance?.toFixed(4) || 0} SOL</i>
        <b>Executable : ${res.executable} </b>
        <a href="${res.explorer || '#'}" target="_blank">Explorer URL</a>
        <b>Owner : ${res.owner || 'Unknown'} </b>
        <b>System Account : ${res.isSystemAccount}</b>
        <b>Token Account : ${res.isTokenAccount}</b>
        <b>Lamports : ${res.lamports?.toString() || '0'}</b>
        <b>Status : ${res.status}</b>`, { parse_mode: "HTML" });
    } catch (error: any) {
        console.log(error);
        await ctx.reply(`❌ Error: ${error.message || String(error)}`);
    }
})

kuro.command("verify", async ctx => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    if (!accountPubkey) {
        await ctx.reply("Please provide an account public key. Usage:\n/verify <account_public_key>");
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
            `📍 Account: \`${accountPubkey}\`\n\n` +
            `Reclaimable: ${res.reclaimable ? "✅ Yes" : "❌ No"}\n` +
            `Status: ${res.status}\n` +
            `Reason: ${res.reason}\n` +
            `Reclaimable Amount: ${reclaimableAmount} SOL\n` +
            `Lamports: ${res.lamports?.toString() || "0"}\n` +
            `System Account: ${res.isSystemAccount ? "Yes" : "No"}`
        );
        await ctx.reply(`ℹ️ To reclaim this account\n\n` + 
            `Use the reclaim command : /reclaim <account_public_key>\n`
        )
    } catch (error: any) {
        console.error(error);
        await ctx.reply(`❌ Error: ${error.message || String(error)}`);
    }
})

kuro.command("reclaim", async (ctx) => {
    const messageText = ctx.message?.text || "";
    const parts = messageText.split(" ");
    const accountPubkey = parts[1];

    if (!accountPubkey) {
        await ctx.reply("Please provide an account public key.\n\nUsage:\n/reclaim <account_public_key>");
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
                `The reclaimed SOL has been sent to the operator treasury.`
            );
        } else {
            await ctx.reply(
                `❌ Reclaim Failed\n\n` +
                `Reason: ${result.error}\n\n` +
                `🔗 Account: ${result.explorerURL}\n\n` +
                `💡 Note: To reclaim rent, you need to own the account or be the close authority.\n\n` +
                `Use /create to make test accounts you can reclaim.\n`
            );
        }
    } catch (error: any) {
        console.error(error);
        await ctx.reply(`❌  Error: ${error.message || String(error)}`);
    }
})



kuro.command("create", async ctx => {
    try {
        await ctx.reply("Creating a new system account... ⏳");

        const newAccount = await createSystemAccount();

        if (!newAccount || !newAccount.success) {
            await ctx.reply(`❌ Failed to create account: ${newAccount?.error || "Unknown error"}`);
            return;
        }

        await ctx.reply(
            `✅ Account Created Successfully!\n\n` +
            `📍 Account Address : ${newAccount.accountPubkey}\n\n` +
            `⛓️ Explorer: ${newAccount.explorerURL}\n\n` +
            `💰 Initial Balance: ${newAccount.initialBalance} SOL\n\n` +
            `This account is now tracked. You can reclaim rent from it later using:\n` +
            `/reclaim ${newAccount.accountPubkey}`
        );

        await ctx.reply(`ℹ️ You can get all the accounts you have added earlier using /list`)
    } catch (error: any) {
        console.error(error);
        await ctx.reply(`❌ Error: ${error.message || String(error)}`);
    }
})

kuro.hears("Whats up?", ctx => {
    ctx.reply("Im doing well brother , just fighting some demons over here 😈")
})

kuro.hears("How are you?", ctx => {
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How are u?", ctx => {
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How are you", ctx => {
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How r u?", ctx => {
    ctx.reply("Im doing fine wbu?")
})

kuro.hears("How are u", ctx => {
    ctx.reply("Im doing fine wbu?")
})

kuro.on("message:text", (ctx) => {
    if (ctx.message.text.includes("/")) return
    const mssg = ctx.message;
    let reply: string;

    ctx.reply("What are we doing today? 😝")
})





kuro.start();