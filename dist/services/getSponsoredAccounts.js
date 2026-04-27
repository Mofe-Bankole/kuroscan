"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSponsoredAccount = getSponsoredAccount;
const supabase_1 = require("../lib/supabase");
async function getSponsoredAccount(publicKey) {
    const { data, error } = await supabase_1.supabase
        .from("sponsored_accounts")
        .select()
        .eq("account_pubkey", publicKey);
    if (error) {
        console.error(error.message);
        throw error;
    }
    return data;
}
