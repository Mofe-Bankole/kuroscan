import { Keypair, PublicKey } from "@solana/web3.js";
import config from "../config/config";
import bs58 from "bs58";

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");

export const OPERATOR_PUBKEY = new PublicKey(config.SPONSOR_PUBKEY);

export const OPERATOR_KEYPAIR = Keypair.fromSecretKey(bs58.decode(config.SPONSOR_PRIVATE_KEY));
