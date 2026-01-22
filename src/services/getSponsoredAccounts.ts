import { supabase } from "../lib/supabase";
export type SponsoredAccount = {
    account_pubkey : string;
    sponsor_pubkey : string;
}


export async function getSponsoredAccounts() {
    // Fetch sponsor and account public keys from the "sponsored_accounts" table
    const { data, error } = await supabase
        .from("sponsored_accounts")
        .select("sponsor_pubkey, account_pubkey");

    // Handle any errors that occur during fetch
    if (error) {
        console.error("Error fetching sponsored accounts:", error.message);
        throw error;
    }

    // If no data is returned, provide a friendly message
    if (!data || data.length === 0) {
        return "No sponsored accounts found.";
    }
   
    const res : SponsoredAccount[] = []  
    data.forEach(acc => {res.push(acc)})

    return res
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