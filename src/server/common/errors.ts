import { TRPCError } from "@trpc/server";

export const GOOGLE_TOKEN_ERROR_MESSAGE = "Google_Token_Expired_Error";

export const TRPC_GOOGLE_EXPIRED_ERROR = new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: GOOGLE_TOKEN_ERROR_MESSAGE });

export class GoogleTokenExpiredError extends Error {
  constructor(message?: string) {
    super(message); // Passes remaining arguments (including vendor specific ones) to parent constructor
    this.name = "GoogleTokenExpiredError";

    // This line is necessary for the error to correctly work when transpiled to JavaScript (it ensures the stack trace points to the right location)
    Object.setPrototypeOf(this, GoogleTokenExpiredError.prototype);
  }
}

export class OutlookTokenExpiredError extends Error {
  constructor(message?: string) {
    super(message); // Passes remaining arguments (including vendor specific ones) to parent constructor
    this.name = "OutlookTokenExpiredError";

    // This line is necessary for the error to correctly work when transpiled to JavaScript (it ensures the stack trace points to the right location)
    Object.setPrototypeOf(this, OutlookTokenExpiredError.prototype);
  }
}
