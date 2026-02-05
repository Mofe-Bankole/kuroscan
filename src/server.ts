import express from "express";
import "./bot/telegram"
import config from "./config/config";
import bs58 from "bs58";
import { getBalance  } from "./utils/solana";
import { supabase } from "./lib/supabase";
import { getReclaimableAmount } from "./services/getReclaimables";
import { kuro } from "./bot/telegram";
import { generateStatCard } from "./utils/canvas";

const app = express();

app.use(express.urlencoded())
app.use(express.json())

const now = Intl.DateTimeFormat('en-NG' , {dateStyle : "medium" , timeStyle : "medium"}).format(new Date())

app.get("/api/v1/health", async (req, res) => {
    res.status(200).json({ message: "Kuroscan API", health: "OK", telegram : "Telegram : https://t.me/@kuroscan_bot"});
}) 


app.get("/api/v1/sponsored" , async(req , res) => {
    const {data , error} = await supabase.from("sponsored_accounts").select("*")
    if (error){
        res.status(500).json("INTERNAL SERVER ERROR")
    }
    res.status(200).json(data);
})

app.listen(process.env.PORT || 4070, async () => {
    kuro.start()
    console.log(`-------------------------------------------------------------------------`);
    console.log(`Bot Running ----------------------------- ${config.PORT}`);
    console.log(`Kora Node ---------------------- ${config.KORA_RPC_URL}`);
    console.log(`Telegram ------------------------------- https://t.me/@mui_scan_bot`);
    console.log(`-------------------------------------------------------------------------`);
    // await generateStatCard({balance : 122 , signature : "cools" , pubkey : "122dda" ,operator : "mofehimself" , token : "SOL"})
})

