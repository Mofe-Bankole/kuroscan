import express from "express";
import "./bot/telegram"
import config from "./config/config.js";
// import { initSponsor } from "./scripts/scanSponsoredAccounts";
import { getBalance  } from "./utils/solana";
import { supabase } from "./lib/supabase";
import { getReclaimableAmount } from "./services/getReclaimables";

const app = express();

app.use(express.urlencoded())
app.use(express.json())

const now = Intl.DateTimeFormat('en-NG' , {dateStyle : "medium" , timeStyle : "medium"}).format(new Date())
// getBalance("FbS9vrQXMss89UGXXpyavV3VRF6ZbgSUXfdmUY4jWn36")

app.get("/api/v1/health", async (req, res) => {
    res.status(200).json({ message: "Kuroscan API", health: "OK", telegram : "Telegram : https://t.me/@kuroscan_bot"});
}) 
// getRentExemptMinimum(50)
// getReclaimableAmount("FbS9vrQXMss89UGXXpyavV3VRF6ZbgSUXfdmUY4jWn36")

app.get("/api/v1/sponsored" , async(req , res) => {
    const {data , error} = await supabase.from("sponsored_accounts").select("*")

    if (error){
        res.status(500).json("INTERNAL SERVER ERROR")
    }

    res.status(200).json(data);

})

app.get("/api/v1/scan" , async(req , res) => {
    
})

app.listen(4070, async () => {
    console.log(`Bot Running on PORT ${config.PORT}`);
    console.log(`Telegram : https://t.me/@kuroscan_bot`);
})
