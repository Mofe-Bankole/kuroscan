export type Account = {
    address: string;
    owner_program: string;
    sponsor_pubkey: string;
    status: "active" | "closed" | "reclaimed"
}

export type AccountInfo = {
    publicKey: string | null;
    balance: number | null;
    explorer: string | null;
    executable: boolean;
    owner: string | null;
    status: "active" | "closed" | "reclaimed"
    space: string | null,
    isSystemAccount: boolean;
    isTokenAccount: boolean;
    exists: boolean;
    data: number | null;
    lamports: bigint;
    rentExempt: number | null;
}

// export interface ReclaimableAccount{
// }

export interface ReClaimableAccount {
    publicKey: string;        // THe acconts publickey
    reclaimable: boolean;     // States if its reclaimable
    status: "active" | "closed";  // Stus of the account
    reason: string;              // Reason for being reclaimable (Dev-frinedly)
    lamports: bigint | null;    // Lamports owned by this account
    rentExemptMinimum: bigint | null;   // Accounts rent -exempt minimum
    reclaimableLamports: bigint;       // NUmber of reclaimable lamports
    isSystemAccount: boolean;
}


export interface ReClaimedSolTransaction {
    success: boolean;    // Success of the transaction
    signature: string;  // The accounts signaturr
    explorerURL: string;      // Solscan explorere URL 
    amount: number            // Amount of sol transfarred
    error: any                // Possble errors
}

export interface ReClaimableAmountInfo {
    balance: number;           // Total balance in SOL
    balanceLamports: bigint;     // Total balance in lamports
    rentExemptMinimum: bigint | null;   // Rent-exempt minimum in lamports
    rentExemptMinimumSOL: number; // Rent-exempt minimum in SOL
    reclaimableAmount: bigint;   // Reclaimable amount in SOL
    reclaimableLamports: bigint; // Reclaimable amount in lamports
}

export interface CreatedAccount {
    success: boolean;
    accountPubkey: string;
    signature: string;
    explorerURL: string;
    accountType: "system" | "token";
    initialBalance: number;
    error?: string;
}

export type AIResponse = {
    res: string,
    err: string | null,
}

export type ReclaimedImageData = {
    pubkey : string;
    operator : string;
    token : "SOL";
    balance : number | null;
    signature : string
  }