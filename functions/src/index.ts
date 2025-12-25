import { onRequest } from "firebase-functions/v2/https";
import { exchangeToken, refreshToken, googleClientId, googleClientSecret } from "./oauth";

// Export OAuth functions with secrets (publicly accessible for OAuth flow) v2
export const oauthExchange = onRequest(
  {
    cors: true,
    secrets: [googleClientId, googleClientSecret],
    invoker: "public"  // Allow unauthenticated access
  },
  exchangeToken
);

export const oauthRefresh = onRequest(
  {
    cors: true,
    secrets: [googleClientId, googleClientSecret],
    invoker: "public"  // Allow unauthenticated access
  },
  refreshToken
);
