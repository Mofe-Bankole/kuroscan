import { Keypair, PublicKey } from "@solana/web3.js";
import sponsorKey from "../sponsorkeypair.json";

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");

export const OPERATOR_PUBKEY = new PublicKey(sponsorKey.publicKey);

export const OPERATOR_KEYPAIR = Keypair.fromSecretKey(new Uint8Array(sponsorKey.secretKey));
