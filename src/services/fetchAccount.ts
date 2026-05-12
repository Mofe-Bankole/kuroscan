import { address } from "@solana/kit";
import { PublicKey } from "@solana/web3.js";
import { DEVNET_SOLANA_CONNECTION } from "../config/rpc";

export async function fetchWalletInfo(pubkey: string) {
  if (!pubkey?.trim()) return null;

  try {
    // Validate base58 before hitting RPC
    new PublicKey(pubkey.trim());
  } catch {
    return null;
  }

  const wallet = address(pubkey.trim());

  const account = await DEVNET_SOLANA_CONNECTION.getAccountInfo(wallet).send();

  return {
    publicKey: wallet,
    explorerUrl: `https://solscan.io/account/${wallet}?cluster=devnet`,
    balance: account.value?.lamports,
    owner: account.value?.owner,
    executable: account.value?.executable,
  };
}
