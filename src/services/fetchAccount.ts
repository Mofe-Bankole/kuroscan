import { address } from "@solana/kit";
import { DEVNET_SOLANA_CONNECTION } from "../config/rpc";
// import { DEVNET_SOLANA_CONNECTION } from "./createAccount";

export async function fetchWalletInfo(pubkey: string) {
  if (!pubkey) return;
  const wallet = address(pubkey);

  const account = await DEVNET_SOLANA_CONNECTION.getAccountInfo(wallet).send();

  return {
    publicKey: wallet,
    explorerUrl: `https://solscan.io/account/${wallet}?cluster=devnet`,
    balance: account.value?.lamports,
    owner: account.value?.owner,
    executable: account.value?.executable,
  };
}
