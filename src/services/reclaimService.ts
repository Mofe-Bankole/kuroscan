import { address, Lamports } from "@solana/kit";
import { getSponsoredAccounts } from "../utils/db";
import {CronJob} from "cron"
import { fetchWalletInfo } from "./fetchAccount";
import { getReclaimableAccount } from "./getReclaimables";
// const cron = new CronJob({})


export async function infiniteScan(){
  const accounts = await getSponsoredAccounts();
  let reclaimable_accounts : any = []
  console.log(accounts)
  for (let acc in accounts){
    const account_info = await getReclaimableAccount(acc)

    if(account_info.reclaimable){
      reclaimable_accounts.push(acc)
    }
  }
}