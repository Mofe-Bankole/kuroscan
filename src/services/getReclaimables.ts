import { ReclaimableAccount } from "../utils/types";
import { getAccountInfo } from "../utils/solana";
import { DEVNET_CONNECTION } from "../config/rpc";

export async function getReclaimableAccount(
  pubKey: string,
): Promise<ReclaimableAccount> {
  try {
    const accountInfo = await getAccountInfo(pubKey);

    if (!accountInfo) {
      return {
        publicKey: pubKey,
        reclaimable: false,
        status: "closed",
        reason: "Account does not exist",
        lamports: 0n,
        rentExemptMinimum: null,
        reclaimableLamports: 0n,
        isSystemAccount: false,
      };
    }

    const lamports = BigInt(accountInfo.lamports ?? 0);

    if (accountInfo.executable) {
      return {
        publicKey: pubKey,
        reclaimable: false,
        status: "active",
        reason: "Executable (program) account",
        lamports,
        rentExemptMinimum: null,
        reclaimableLamports: 0n,
        isSystemAccount: false,
      };
    }

    if (!accountInfo.isSystemAccount) {
      return {
        publicKey: pubKey,
        reclaimable: false,
        status: "active",
        reason: "Not a system account",
        lamports,
        rentExemptMinimum: null,
        reclaimableLamports: 0n,
        isSystemAccount: false,
      };
    }

    if (lamports === 0n) {
      return {
        publicKey: pubKey,
        reclaimable: false,
        status: "closed",
        reason: "Account has no lamports",
        lamports,
        rentExemptMinimum: null,
        reclaimableLamports: 0n,
        isSystemAccount: true,
      };
    }

    const space = Number.parseInt(accountInfo.space ?? "0", 10);
    const rentExemptMin = BigInt(
      await DEVNET_CONNECTION.getMinimumBalanceForRentExemption(
        Number.isFinite(space) ? space : 0,
      ),
    );

    if (lamports <= rentExemptMin) {
      return {
        publicKey: pubKey,
        reclaimable: false,
        status: "active",
        reason: "At or below rent-exempt minimum (nothing safe to sweep)",
        lamports,
        rentExemptMinimum: rentExemptMin,
        reclaimableLamports: 0n,
        isSystemAccount: true,
      };
    }

    const excess = lamports - rentExemptMin;

    return {
      publicKey: pubKey,
      reclaimable: true,
      status: "active",
      reason: "Excess lamports above rent-exempt minimum",
      lamports,
      rentExemptMinimum: rentExemptMin,
      reclaimableLamports: excess,
      isSystemAccount: true,
    };
  } catch (err) {
    console.error(err);
    return {
      publicKey: pubKey,
      reclaimable: false,
      status: "closed",
      reason: "RPC error",
      lamports: null,
      rentExemptMinimum: null,
      reclaimableLamports: 0n,
      isSystemAccount: false,
    };
  }
}
