import { address, createSolanaRpc } from "@solana/kit";
import { supabase } from "../lib/supabase";
import config from "../config/config";
import { Account } from "../utils/types";

const rpc = createSolanaRpc(config.HELIUS_DEVNET_RPC as string);

export async function addNewAccount(req: Account) {
    const {data , error} = await supabase.from("sponsored_accounts").insert({
        account_pubkey : req.address,
        sponsor_pubkey : req.sponsor_pubkey,
        status : "active",
        owner_program : "11111111111111111111111111111111",
    })

    if (error){
        console.log(error)
        return false
    }

    return true
}