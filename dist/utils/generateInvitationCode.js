"use strict";
// src/utils/generateInvitationCode.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvitationCode = generateInvitationCode;
function generateInvitationCode(length = 6) {
    // Par exemple, un code alphanumérique aléatoire
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}
