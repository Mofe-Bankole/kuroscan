import { address, createSolanaRpc } from "@solana/kit";
import config from "../config/config";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { publicKey, secretKey } from "../sponsorkeypair.json"
import { AccountInfo, ReclaimableAccount, ReClaimedSolTransaction } from "./types";
import { SYSTEM_PROGRAM, TOKEN_PROGRAM_ID } from "./constants";

const rpc = createSolanaRpc(config.SOLANA_DEVNET_RPC as string);

export async function getBalance(pubKey: string) {
    const addr = address(pubKey)
    const data = await rpc.getBalance(addr).send()
    const res = Math.abs(parseFloat(data.value.toString()) / (LAMPORTS_PER_SOL))
    return res
}


// Get account Info
export async function getAccountInfo(pubKey: string): Promise<AccountInfo> {
    const addr = address(pubKey);

    try {
        const balanceResponse = await getBalance(pubKey);
        const accountInfoResponse = await rpc.getAccountInfo(address(pubKey)).send();
        const accountInfo = accountInfoResponse.value;
        const explorerUrl = `https://solscan.io/account/${pubKey}?cluster=devnet`
        let data = accountInfo?.data.length || 0;
        const rentExempt = await getRentExemptMinimum(data)

        if (!accountInfo) {
            return {
                balance: null,
                publicKey: pubKey,
                explorer: null,
                executable: false,
                owner: null,
                space: null,
                exists: false,
                status: "closed",
                isSystemAccount: false,
                isTokenAccount: false,
                lamports: null
            };
        }

        const isSystemAccount = accountInfo.owner.toString() === SYSTEM_PROGRAM.toString();
        const isTokenAccount = accountInfo.owner.toString() === TOKEN_PROGRAM_ID.toString();
        return {
            publicKey: pubKey,
            balance: balanceResponse,
            exists: true,
            explorer: explorerUrl,
            executable: accountInfo?.executable || false,
            owner: accountInfo?.owner.toString() || "",
            space: accountInfo?.space.toString() || "",
            status: "active",
            isSystemAccount,
            isTokenAccount,
            lamports: rentExempt
        }
    } catch (error) {
        console.error(`Error : ${error}`);
        throw error
    }
}

//Get the rent
export async function getRentExemptMinimum(data: number) {
    if (!data) return null;

    try {
        // getMinimumBalanceForRentExemption expects a number or bigint for space
        let dataLength = BigInt(data)
        const minimumResponse = await rpc.getMinimumBalanceForRentExemption(dataLength).send();
        const minimum = minimumResponse;
        return minimum;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getReclaimableAccount(pubKey: string): Promise<ReclaimableAccount> {
    try {
        // Get account info from Solana RPC
        const accountInfoResponse = await rpc.getAccountInfo(address(pubKey)).send();
        const accountInfo = accountInfoResponse.value;
        // If account does not exist
        if (!accountInfo) {
            return {
                publicKey: pubKey,
                reclaimable: false,
                status: "closed",
                reason: "Account does not exist",
                lamports: null,
                rentExemptMinimum: null,
            };
        }

        const lamports: bigint = BigInt(accountInfo.lamports?.toString() || "0");

        // Get minimum rent-exempt
        const rentExemptMinimum: bigint = await (async () => {
            if (typeof accountInfo.data === "string" || Array.isArray(accountInfo.data)) {
                // If data is a Buffer or string, length property can be used
                let space = (accountInfo.data as any)?.length || 0;
                try {
                    const minimum = await rpc.getMinimumBalanceForRentExemption(space).send();
                    return BigInt(minimum);
                } catch {
                    return BigInt(0);
                }
            } else if (typeof accountInfo.data === "object" && accountInfo.data !== null && "length" in accountInfo.data) {
                let space = (accountInfo.data as any).length || 0;
                try {
                    const minimum = await rpc.getMinimumBalanceForRentExemption(space).send();
                    return BigInt(minimum);
                } catch {
                    return BigInt(0);
                }
            }
            return BigInt(0);
        })();

        // If executable (program account)
        if (accountInfo.executable) {
            return {
                publicKey: pubKey,
                reclaimable: false,
                status: "active",
                reason: "Executable Account",
                lamports,
                rentExemptMinimum,
            };
        }

        // If already closed
        if (!accountInfo || lamports === BigInt(0)) {
            return {
                publicKey: pubKey,
                reclaimable: false,
                status: "closed",
                reason: "Account already closed or empty",
                lamports: lamports,
                rentExemptMinimum,
            };
        }

        // If account balance is above rent-exempt minimum, can be reclaimed
        if (lamports > rentExemptMinimum) {
            return {
                publicKey: pubKey,
                reclaimable: true,
                status: "active",
                reason: "Above rent-exempt minimum",
                lamports,
                rentExemptMinimum,
                reclaimableLamports: lamports - rentExemptMinimum,
            };
        }

        // If balance is below rent-exempt minimum, can be reclaimed (all lamports)
        if (lamports > BigInt(0) && lamports <= rentExemptMinimum) {
            return {
                publicKey: pubKey,
                reclaimable: true,
                status: "active",
                reason: "Balance not rent-exempt",
                lamports,
                rentExemptMinimum,
                reclaimableLamports: lamports,
            };
        }

        // Not reclaimable by default
        return {
            publicKey: pubKey,
            reclaimable: false,
            status: "active",
            reason: "Not eligible for Reclamation",
            lamports,
            rentExemptMinimum,
        };

    } catch (error) {
        console.error(error);
        return {
            publicKey: pubKey,
            reclaimable: false,
            status: "closed",
            reason: "Error Fetching Account Data",
            lamports: null,
            rentExemptMinimum: null,
        };
    }
}

export async function reclaimSOL(pubKey: string) {
    const accountInfoResponse = await rpc.getAccountInfo(address(pubKey)).send();
    const accountInfo = accountInfoResponse.value;
}