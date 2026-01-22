import { Lamports } from "@solana/kit";

export type Account = {
    address : string;
    owner_program : string;
    sponsor_pubkey : string;
    status : "active" | "closed" | "reclaimed"
}

export type AccountInfo = {
    publicKey : string | null;
    balance : number| null;
    explorer : string | null;
    executable : boolean;
    owner : string | null;
    status : "active" | "closed" | "reclaimed"
    space : string  | null,
    isSystemAccount : boolean;
    isTokenAccount : boolean;
    exists : boolean;
    lamports : Lamports |  null;
}

// export interface ReclaimableAccount{
// }

export interface ReclaimableAccount {
    publicKey: string;
    reclaimable: boolean;
    status: "active" | "closed";
    reason: string;
    lamports: bigint | null;
    rentExemptMinimum: bigint | null;
    reclaimableLamports?: bigint;
  }
  

export interface ReClaimedSolTransaction{
    success : boolean;
    signature : string;
    explorerURL : string;
    amount : number
    error : any
}