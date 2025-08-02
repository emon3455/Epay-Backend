"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlerDuplicateError = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const handlerDuplicateError = (err) => {
    const matchedArray = err.message.match(/"([^"]*)"/);
    const fieldName = matchedArray ? matchedArray[1] : "Required Field";
    return {
        statusCode: 400,
        message: `${fieldName} already exists!!`,
    };
};
exports.handlerDuplicateError = handlerDuplicateError;
