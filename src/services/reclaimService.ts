import config from "../config/config";
import { getReclaimableAccount } from "./getReclaimables";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { supabase } from "../lib/supabase";

const connection = new Connection(
  config.SOLANA_DEVNET_RPC as string,
  "confirmed",
);


export async function reclaimRentFromAllSponsoredAccounts() {
  try {
    const accounts : any = supabase.from(`sponsored_accounts`).select('*');
    console.log(accounts);

    
  } catch (error) {
    
  }
  
}
