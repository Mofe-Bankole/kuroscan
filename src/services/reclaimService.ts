import { getSponsoredAccounts } from "../utils/db";

export async function scanWallets() {
  const wallets = await getSponsoredAccounts()
  console.log(wallets)

  return wallets
}