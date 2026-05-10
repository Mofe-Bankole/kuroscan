import "dotenv/config";

const PORT = process.env.PORT;

const KORA_RPC_URL = process.env.KORA_RPC_URL as string;

const HELIUS_DEVNET_RPC = process.env.HELIUS_DEVNET_RPC as string;

const BOT_TOKEN = process.env.BOT_TOKEN as string;

const SOLANA_DEVNET_RPC = process.env.SOLANA_DEVNET_RPC;

const KORA_DEVNET_API = process.env.KORA_DEVNET_API;

const SOLANA_MAINNET_RPC = process.env.SOLANA_MAINNET_RPC!;

const NODE_PUBLIC_SUPABASE_URL = process.env.NODE_PUBLIC_SUPABASE_URL as string;

const NODE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = process.env
  .NODE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;

const SPONSOR_PUBKEY = process.env.KORA_SPONSOR_PUBLIC_KEY as string;

const KORA_PRIVATE_KEY = process.env.KORA_PRIVATE_KEY as any;
// Threshold (in SOL) at which the auto‑reclaim scheduler will fire.
const AUTO_RECLAIM_THRESHOLD_SOL = 3; // you can adjust this value

// To do : reduce or increase this
// 10 mins (simply change the 10 to any number of minutes you so desire)
// Interval (in ms) between auto‑reclaim checks.
const AUTO_RECLAIM_CHECK_INTERVAL_MS = 1 * 60_000; // 10 minutes
const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(",")
  : [6600089258];

const config = {
  PORT,
  KORA_RPC_URL,
  SPONSOR_PUBKEY,
  SOLANA_MAINNET_RPC,
  KORA_PRIVATE_KEY,
  SOLANA_DEVNET_RPC,
  HELIUS_DEVNET_RPC,
  BOT_TOKEN,
  KORA_DEVNET_API,
  NODE_PUBLIC_SUPABASE_URL,
  NODE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  AUTO_RECLAIM_CHECK_INTERVAL_MS,
  AUTO_RECLAIM_THRESHOLD_SOL,
  ADMIN_IDS,
};

export default config;
