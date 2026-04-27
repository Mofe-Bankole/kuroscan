"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSponsoredAccounts = getSponsoredAccounts;
exports.fetchTelegramId = fetchTelegramId;
exports.fetchSponsor = fetchSponsor;
exports.fetchOperatorSponsoredAccounts = fetchOperatorSponsoredAccounts;
exports.saveSponsoredAccount = saveSponsoredAccount;
exports.fetchSponsoredAccounts = fetchSponsoredAccounts;
exports.fetchSponsoredAccountsAndPrivateKey = fetchSponsoredAccountsAndPrivateKey;
exports.updateSponsoredAccountStatus = updateSponsoredAccountStatus;
exports.fetchUserId = fetchUserId;
exports.storeUser = storeUser;
const supabase_1 = require("../lib/supabase");
const bs58_1 = __importDefault(require("bs58"));
async function getSponsoredAccounts() {
    // Fetch sponsor and account public keys from the "sponsored_accounts" table
    const { data, error } = await supabase_1.supabase
        .from("sponsored_accounts")
        .select("public_key, status");
    // Handle any errors that occur during fetch
    if (error) {
        console.error("Error fetching sponsored accounts:", error.message);
        throw error;
    }
    return data;
}
// export async function fetchALll
async function fetchTelegramId(id) {
    const { data, error } = await supabase_1.supabase
        .from("users")
        .select()
        .eq("telegram_id", id);
    if (error) {
        console.error(error);
        throw error;
    }
    return data;
}
async function fetchSponsor() {
    // Fetch the sponsor_pubkey values from the sponsored_accounts table
    const { data, error } = await supabase_1.supabase
        .from("sponsored_accounts")
        .select("sponsor_pubkey");
    if (error) {
        console.error("Error fetching sponsor_pubkey:", error);
        throw error;
    }
    return data;
}
async function fetchOperatorSponsoredAccounts() {
}
async function saveSponsoredAccount(public_key, secret_key) {
    const { error } = await supabase_1.supabase.from("sponsored_accounts").insert({
        public_key: public_key,
        secret_key: bs58_1.default.encode(secret_key),
        status: "active",
    });
    return !error;
}
async function fetchSponsoredAccounts() {
    const { data, error } = await supabase_1.supabase
        .from("sponsored_accounts")
        .select("public_key, status");
    if (error) {
        console.error(error);
        throw error;
    }
    return data;
}
async function fetchSponsoredAccountsAndPrivateKey() {
    const { data, error } = await supabase_1.supabase
        .from("sponsored_accounts")
        .select("public_key, status, secret_key, owner_public_key");
    if (error) {
        console.error(error);
        throw error;
    }
    return (data || []);
}
async function updateSponsoredAccountStatus(public_key, status) {
    const { error } = await supabase_1.supabase
        .from("sponsored_accounts")
        .update({ status })
        .eq("public_key", public_key);
    if (error) {
        console.error(error);
        throw error;
    }
    return true;
}
async function fetchUserId(id) {
    const { data, error } = await supabase_1.supabase
        .from("users")
        .select("telegram_id")
        .eq("telegram_id", id);
    if (error) {
        console.error(error);
        throw error;
    }
    return data;
}
async function storeUser(id) {
    const { error } = await supabase_1.supabase.from("users").insert({
        telegram_id: id.toString(),
    });
    return !error;
}
