import { createSystemAccount } from "../services/createAccount";
import { CreatedAccount } from "../utils/types";

export type ZombieAccount = {
  error: string | null;
  account: CreatedAccount | null;
};
export async function handleZombie(): Promise<ZombieAccount> {
  let errorMessage: string | null = null;

  try {
    const account_data = await createSystemAccount();

    if (!account_data.success) {
      errorMessage = "Failed to Create Zombie Account";
      return {
        error: errorMessage,
        account: null,
      };
    }

    return {
      error: errorMessage,
      account: account_data,
    };
  } catch (err: any) {
    errorMessage = "Failed to Create Zombie Account";
    return {
      error: errorMessage,
      account: null,
    };
  }
}
