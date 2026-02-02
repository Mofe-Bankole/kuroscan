import { supabase } from "../lib/supabase";
export type SponsoredAccount = {
    account_pubkey : string;
    sponsor_pubkey : string;
}


export async function getSponsoredAccount(publicKey: string) {
    const { data , error } = await supabase
        .from("sponsored_accounts")
        .select()
        .eq("account_pubkey", publicKey)

    if (error) {
        console.error(error.message)
        throw error;
    }

    return data;
}