"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStatCard = generateStatCard;
const canvas_1 = require("canvas");
const path_1 = __importDefault(require("path"));
async function generateStatCard(data) {
    const width = 1200;
    const height = 630;
    const canvas = (0, canvas_1.createCanvas)(width, height);
    const ctx = canvas.getContext('2d');
    // background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    // text
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${data.pubkey}`, 300, 500);
    // template overlay
    const templatePath = path_1.default.resolve(__dirname, '../images/template.png');
    const templateImage = await (0, canvas_1.loadImage)(templatePath);
    ctx.drawImage(templateImage, 0, 0, width, height);
    // write file
    const buffer = canvas.toBuffer('image/png');
    return {
        buffer,
    };
}
