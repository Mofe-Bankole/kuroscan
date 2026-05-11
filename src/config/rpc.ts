import { createSolanaRpc } from "@solana/kit";
import { Connection } from "@solana/web3.js";
import config from "./config";

export const DEVNET_CONNECTION = new Connection(
  "https://api.devnet.solana.com",
);
export const MAINNET_CONNECTION = createSolanaRpc(config.SOLANA_DEVNET_RPC!);
export const DEVNET_SOLANA_CONNECTION = createSolanaRpc(
  config.SOLANA_DEVNET_RPC!,
);
