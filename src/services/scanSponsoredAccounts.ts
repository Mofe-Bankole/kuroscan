import { supabase } from "../lib/supabase";
import {createRpc, signTransaction} from "@solana/kit";

// export async function scanSponsoredAccounts(reclaim : boolean) {
//     const rpc = createRpc("")
//     const {data , error} = await supabase.from("sponsored_accounts").select("*");
//     console.log(data)
//     if (reclaim){
        
//     }
    
// }