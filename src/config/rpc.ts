import { createSolanaRpc } from "@solana/kit";
import { Connection } from "@solana/web3.js";
import config from "./config";

/** Public devnet HTTP endpoint used by @solana/web3.js Connection helpers. */
const devnetHttpUrl =
  config.SOLANA_DEVNET_RPC ||
  config.HELIUS_DEVNET_RPC ||
  "https://api.devnet.solana.com";

export const DEVNET_CONNECTION = new Connection(devnetHttpUrl, "confirmed");

/** Kit RPC client (same cluster as {@link DEVNET_CONNECTION}). */
export const DEVNET_SOLANA_CONNECTION = createSolanaRpc(devnetHttpUrl);

/** Optional mainnet Kit client when `SOLANA_MAINNET_RPC` is set. */
export const MAINNET_SOLANA_CONNECTION = config.SOLANA_MAINNET_RPC
  ? createSolanaRpc(config.SOLANA_MAINNET_RPC)
  : null;
