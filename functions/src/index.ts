import { onRequest } from "firebase-functions/v2/https";
import { exchangeToken, refreshToken, googleClientId, googleClientSecret } from "./oauth";

// Export OAuth functions with secrets
export const oauthExchange = onRequest(
  { cors: true, secrets: [googleClientId, googleClientSecret] },
  exchangeToken
);

export const oauthRefresh = onRequest(
  { cors: true, secrets: [googleClientId, googleClientSecret] },
  refreshToken
);
