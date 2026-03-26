import express from "express";
import "./bot/telegram";
import config from "./config/config";
import { supabase } from "./lib/supabase";
import { kuro } from "./bot/telegram";
import{KoraClient} from "@solana/kora";

const app = express();

export const kora = new KoraClient({
    rpcUrl : "http://localhost:8080"
})

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

kuro.start()
app.listen(process.env.PORT || 4070, async () => {
    console.log(`-------------------------------------------------------------------------`);
    console.log(`Bot Running ---------------------------------------------- ${config.PORT}`);
    console.log(`Kora Node ---------------------------------------- ${config.KORA_RPC_URL}`);
    console.log(`Telegram ------------------------------------- https://t.me/@mui_scan_bot`);
    console.log(`-------------------------------------------------------------------------`);
})

