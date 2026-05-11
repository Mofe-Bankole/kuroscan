"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = __importDefault(require("../config/config"));
exports.supabase = (0, supabase_js_1.createClient)(config_1.default.NODE_PUBLIC_SUPABASE_URL, config_1.default.NODE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
