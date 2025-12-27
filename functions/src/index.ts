import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { exchangeToken, refreshToken, googleClientId, googleClientSecret } from "./oauth";

// Define secrets for API keys
const aviationStackApiKey = defineSecret("AVIATIONSTACK_API_KEY");

// Proxy for mindicador.cl API (Chilean economic indicators)
export const mindicadorProxy = onRequest(
  {
    cors: true,
    invoker: "public"
  },
  async (req, res) => {
    try {
      // Only allow GET requests
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      // Fetch from mindicador.cl
      const response = await fetch("https://mindicador.cl/api", {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Boxento/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`Mindicador API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache for 5 minutes (UF updates daily, but we want fresh data)
      res.set("Cache-Control", "public, max-age=300");
      res.json(data);
    } catch (error) {
      console.error("Error fetching mindicador data:", error);
      res.status(500).json({
        error: "Failed to fetch data from mindicador.cl",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

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

// Proxy for AviationStack API (Flight tracking)
// Moves the API key server-side so users don't need their own key
export const flightProxy = onRequest(
  {
    cors: true,
    secrets: [aviationStackApiKey],
    invoker: "public"
  },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const apiKey = aviationStackApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: "API key not configured" });
        return;
      }

      // Get query parameters from the request
      const { flight_iata, flight_icao, flight_date, airline_iata, airline_icao } = req.query;

      if (!flight_iata && !flight_icao) {
        res.status(400).json({ error: "Flight number (flight_iata or flight_icao) is required" });
        return;
      }

      // Build the AviationStack API URL
      const params = new URLSearchParams({ access_key: apiKey });
      if (flight_iata) params.append("flight_iata", flight_iata as string);
      if (flight_icao) params.append("flight_icao", flight_icao as string);
      if (flight_date) params.append("flight_date", flight_date as string);
      if (airline_iata) params.append("airline_iata", airline_iata as string);
      if (airline_icao) params.append("airline_icao", airline_icao as string);

      // Note: AviationStack free tier only supports HTTP, not HTTPS
      const apiUrl = `http://api.aviationstack.com/v1/flights?${params.toString()}`;
      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Boxento/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`AviationStack API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache for 2 minutes (flight data updates frequently)
      res.set("Cache-Control", "public, max-age=120");
      res.json(data);
    } catch (error) {
      console.error("Error fetching flight data:", error);
      res.status(500).json({
        error: "Failed to fetch flight data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// CORS Proxy for RSS feeds
// Replaces third-party allorigins.win dependency with our own proxy
export const rssProxy = onRequest(
  {
    cors: true,
    invoker: "public"
  },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const feedUrl = req.query.url as string;
      if (!feedUrl) {
        res.status(400).json({ error: "Feed URL is required" });
        return;
      }

      // Validate URL
      try {
        new URL(feedUrl);
      } catch {
        res.status(400).json({ error: "Invalid URL format" });
        return;
      }

      const response = await fetch(feedUrl, {
        headers: {
          "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml",
          "User-Agent": "Boxento RSS Reader/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.status}`);
      }

      const data = await response.text();

      // Set appropriate headers
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300"); // Cache for 5 minutes
      res.send(data);
    } catch (error) {
      console.error("Error fetching RSS feed:", error);
      res.status(500).json({
        error: "Failed to fetch RSS feed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Proxy for currency exchange rates using Frankfurter API (completely free, no key needed)
// Centralizes currency data so users don't need their own API keys
export const currencyProxy = onRequest(
  {
    cors: true,
    invoker: "public"
  },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const base = (req.query.base as string) || "USD";
      const symbols = req.query.symbols as string; // Optional: comma-separated list

      // Build the Frankfurter API URL
      let apiUrl = `https://api.frankfurter.app/latest?from=${base}`;
      if (symbols) {
        apiUrl += `&to=${symbols}`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Boxento/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to match Open Exchange Rates format for compatibility
      const transformedData = {
        base: data.base,
        date: data.date,
        rates: data.rates
      };

      // Cache for 1 hour (exchange rates don't change that frequently)
      res.set("Cache-Control", "public, max-age=3600");
      res.json(transformedData);
    } catch (error) {
      console.error("Error fetching currency rates:", error);
      res.status(500).json({
        error: "Failed to fetch currency rates",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
