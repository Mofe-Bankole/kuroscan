import { supabase } from "../lib/supabase";
import { decrypt, encrypt } from "./crypto";

export type SponsoredAccount = {
  public_key: string;
  status: string;
};

export type spaacc = {
  id: number;
  created_at: string;
  public_key: string;
  secret_key: string;
  owner_public_key: string;
};

export type DBAccount = {
  public_key: string;
  secret_key: any;
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

export async function getSponsoredAccount(publicKey: string) {
  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select()
    .eq("account_pubkey", publicKey);

  if (error) {
    console.error(error.message);
    throw error;
  }

  return data;
}

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

export async function fetchSponsor(id: number) {
  const user_id = await fetchTelegramId(id);
  const ownerId = user_id && user_id[0] ? user_id[0].id : null;
  if (!ownerId) {
    throw new Error("User not found, cannot fetch sponsors.");
  }
  const { data, error } = await supabase
    .from("sponsors")
    .select("public_key , telegram_user_id, owner")
    .eq("owner", ownerId);

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function fetchOperatorSponsoredAccounts(id: number) {
  const sponsors = await fetchSponsor(id);

  if (!sponsors || sponsors.length === 0) {
    return [];
  }

  const sponsorPubKey = sponsors[0].public_key;

  if (!sponsorPubKey) {
    throw new Error("Sponsor public key not found.");
  }

  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select("id, created_at, public_key, secret_key, owner_public_key")
    .eq("owner_public_key", sponsorPubKey);

  if (error) {
    console.error(error);
    throw error;
  }

  return (data || []) as spaacc[];
}

export async function saveSponsoredAccount(
  public_key: string,
  secret_key: any,
) {
  const { error } = await supabase.from("sponsored_accounts").insert({
    public_key: public_key,
    secret_key: encrypt(secret_key),
    status: "active",
  });

  return !error;
}

export async function fetchSponsoredAccount(public_key: string) {
  const { data, error } = await supabase
    .from("sponsored_accounts")
    .select("public_key, secret_key")
    .eq("public_key", public_key);
  if (error) {
    console.error(error);
    throw error;
  }

  return data;
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
