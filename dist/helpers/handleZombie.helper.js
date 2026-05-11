"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZombie = handleZombie;
const createAccount_1 = require("../services/createAccount");
async function handleZombie() {
    let errorMessage = null;
    try {
        const account_data = await (0, createAccount_1.createSystemAccount)();
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
    }
    catch (err) {
        errorMessage = "Failed to Create Zombie Account";
        return {
            error: errorMessage,
            account: null,
        };
    }
}
