import { address, createSolanaRpc } from "@solana/kit";
import config from "../config/config";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AccountInfo } from "./types";
import { SYSTEM_PROGRAM, TOKEN_PROGRAM_ID } from "./constants";
import { getRentExemptMinimum } from "../services/getReclaimables";

const rpc = createSolanaRpc(config.SOLANA_DEVNET_RPC as string);

export async function getBalance(pubKey: string) {
    const addr = address(pubKey)
    const data = await rpc.getBalance(addr).send()
    const res = Math.abs(parseFloat(data.value.toString()) / (LAMPORTS_PER_SOL))
    return res
}

// Get account Info
export async function getAccountInfo(pubKey: string): Promise<AccountInfo> {
    try {
        const balanceResponse = await getBalance(pubKey);
        const accountInfoResponse = await rpc.getAccountInfo(address(pubKey.trim())).send();

        const accountInfo = accountInfoResponse.value;
        const explorerUrl = `https://solscan.io/account/${pubKey}?cluster=devnet`

        let data = accountInfo?.data.length || 0;
        const rentExempt = await getRentExemptMinimum(data)

        if (!accountInfo) {
            return {
                balance: null,
                data : null,
                publicKey: pubKey,
                explorer: null,
                executable: false,
                owner: null,
                space: null,
                exists: false,
                status: "closed",
                isSystemAccount: false,
                isTokenAccount: false,
                lamports: 0n,
                rentExempt : null
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
            lamports: BigInt(accountInfo?.lamports || 0),
            data, 
            rentExempt,
        }
    } catch (error) {
        console.error(`Error : ${error}`);
        throw error
    }
}