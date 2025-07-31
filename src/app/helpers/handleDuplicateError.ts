import { TGenericErrorResponse } from "../interfaces/error.types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handlerDuplicateError = (err: any): TGenericErrorResponse => {
  const matchedArray = err.message.match(/"([^"]*)"/);

  const fieldName = matchedArray ? matchedArray[1] : "Required Field";

  return {
    statusCode: 400,
    message: `${fieldName} already exists!!`,
  };
};
