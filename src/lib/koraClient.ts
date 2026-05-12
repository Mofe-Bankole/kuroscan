import { KoraClient } from "@solana/kora";
import config from "../config/config";

/** Shared Kora client — keep out of `server.ts` to avoid circular imports with the bot. */
export const kora = new KoraClient({
  rpcUrl: config.KORA_RPC_URL,
});
