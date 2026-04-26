import { address } from "@solana/kit";
import { DEVNET_CONNECTION, DEVNET_SOLANA_CONNECTION, MAINNET_CONNECTION } from "./createAccount";

export async function fetchWalletInfo(pubkey : string){
    if(!pubkey) return;
    const wallet = address(pubkey)
  
    const account = await DEVNET_SOLANA_CONNECTION.getAccountInfo(wallet).send();

    return{
        publicKey : wallet,
        explorerUrl : `https://solscan.io/account/${wallet}?cluster=devnet`,
        balance : account.value?.lamports,
        owner : account.value?.owner,
        executable : account.value?.executable
    }
  }