import { supabase } from "../lib/supabase";
import bs58 from "bs58";

export type SponsoredAccount = {
  public_key: string;
  status: string;
};

export type DBAccount = {
  public_key: string;
  secret_key: any;
};

export type SponsoredAccountWithSecret = {
  public_key: string;
  status: string;
  secret_key: string;
  sponsor_pubkey: string;
};

export async function getSponsoredAccounts() {
  // Fetch sponsor and account public keys from the "sponsored_accounts" table
  const { data, error } = await supabase
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
export async function fetchTelegramId(id: number) {
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("telegram_id", id);

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function fetchSponsor() {
  // Fetch the sponsor_pubkey values from the sponsored_accounts table
  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select("sponsor_pubkey");

  if (error) {
    console.error("Error fetching sponsor_pubkey:", error);
    throw error;
  }

  return data;
}

export async function fetchOperatorSponsoredAccounts() {}

export async function saveSponsoredAccount(
  public_key: string,
  secret_key: Uint8Array,
) {
  const { error } = await supabase.from("sponsored_accounts").insert({
    public_key: public_key,
    secret_key: bs58.encode(secret_key),
    status: "active",
  });

  return !error;
}

export async function fetchSponsoredAccounts() {
  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select("public_key, status");

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function fetchSponsoredAccountsAndPrivateKey() {
  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select("public_key, status, secret_key, sponsor_pubkey");

  if (error) {
    console.error(error);
    throw error;
  }

  return (data || []) as SponsoredAccountWithSecret[];
}

export async function updateSponsoredAccountStatus(
  public_key: string,
  status: "active" | "closed" | "reclaimed",
) {
  const { error } = await supabase
    .from("sponsored_accounts")
    .update({ status })
    .eq("public_key", public_key);

  if (error) {
    console.error(error);
    throw error;
  }

  return true;
}

export async function fetchUserId(id: number) {
  const { data, error } = await supabase
    .from("users")
    .select("telegram_id")
    .eq("telegram_id", id);

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function storeUser(id: number) {
  const { error } = await supabase.from("users").insert({
    telegram_id: id.toString(),
  });

  return !error;
}

export async function fetchSponsoredAccountsNumber() {
  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select("status");

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}
