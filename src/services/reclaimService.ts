import bs58 from "bs58";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { DEVNET_CONNECTION } from "./createAccount";
import { getReclaimableAccount } from "./getReclaimables";
import {
  fetchSponsoredAccountsAndPrivateKey,
  SponsoredAccountWithSecret,
  updateSponsoredAccountStatus,
} from "../utils/db";

type ReclaimResult = {
  account: string;
  destination: string;
  success: boolean;
  lamports: bigint;
  signature?: string;
  reason?: string;
};

type ReclaimSummary = {
  reclaimed: ReclaimResult[];
  skipped: ReclaimResult[];
  totalLamports: bigint;
  totalSol: number;
};

async function reclaimSingleAccount(
  account: SponsoredAccountWithSecret,
): Promise<ReclaimResult> {
  const reclaimInfo = await getReclaimableAccount(account.public_key);

  if (!reclaimInfo.reclaimable) {
    return {
      account: account.public_key,
      destination: account.sponsor_pubkey,
      success: false,
      lamports: 0n,
      reason: reclaimInfo.reason,
    };
  }

  if (!account.sponsor_pubkey) {
    return {
      account: account.public_key,
      destination: "",
      success: false,
      lamports: 0n,
      reason: "Missing destination owner_public_key",
    };
  }

  if (reclaimInfo.reclaimableLamports <= 0n) {
    return {
      account: account.public_key,
      destination: account.sponsor_pubkey,
      success: false,
      lamports: 0n,
      reason: "No reclaimable lamports",
    };
  }

  const signer = Keypair.fromSecretKey(bs58.decode(account.secret_key));
  const destination = new PublicKey(account.sponsor_pubkey);
  const latestBlockhash = await DEVNET_CONNECTION.getLatestBlockhash("finalized");

  const feeProbe = new Transaction({
    feePayer: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: destination,
      lamports: 1,
    }),
  );

  const estimatedFee =
    BigInt((await DEVNET_CONNECTION.getFeeForMessage(feeProbe.compileMessage())).value ?? 0);

  if (reclaimInfo.reclaimableLamports <= estimatedFee) {
    return {
      account: account.public_key,
      destination: account.sponsor_pubkey,
      success: false,
      lamports: reclaimInfo.reclaimableLamports,
      reason: "Balance too small to cover transaction fee",
    };
  }

  const lamportsToSend = reclaimInfo.reclaimableLamports - estimatedFee;
  const transaction = new Transaction({
    feePayer: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: destination,
      lamports: Number(lamportsToSend),
    }),
  );

  transaction.sign(signer);

  const signature = await DEVNET_CONNECTION.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: false,
      maxRetries: 3,
    },
  );

  await DEVNET_CONNECTION.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  await updateSponsoredAccountStatus(account.public_key, "reclaimed");

  return {
    account: account.public_key,
    destination: account.sponsor_pubkey,
    success: true,
    lamports: lamportsToSend,
    signature,
  };
}

export async function reclaimSponsoredAccounts(): Promise<ReclaimSummary> {
  const accounts = await fetchSponsoredAccountsAndPrivateKey();
  const reclaimed: ReclaimResult[] = [];
  const skipped: ReclaimResult[] = [];

  for (const account of accounts) {
    try {
      const result = await reclaimSingleAccount(account);

      if (result.success) {
        reclaimed.push(result);
      } else {
        skipped.push(result);
      }
    } catch (error: any) {
      skipped.push({
        account: account.public_key,
        destination: account.sponsor_pubkey ?? "",
        success: false,
        lamports: 0n,
        reason: error?.message ?? "Failed to reclaim account",
      });
    }
  }

  const totalLamports = reclaimed.reduce(
    (sum, result) => sum + result.lamports,
    0n,
  );

  return {
    reclaimed,
    skipped,
    totalLamports,
    totalSol: Number(totalLamports) / LAMPORTS_PER_SOL,
  };
}
