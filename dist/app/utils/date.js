"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDateMatch = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const buildDateMatch = (startDate, endDate) => {
    const match = {};
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate)
            match.createdAt.$gte = new Date(startDate);
        if (endDate)
            match.createdAt.$lte = new Date(endDate);
    }
    return match;
};
exports.buildDateMatch = buildDateMatch;
