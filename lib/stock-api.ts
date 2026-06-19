const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 min for live quotes
  readonly SEARCH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for symbol search
  readonly DAILY_TTL = 12 * 60 * 60 * 1000; // 12 hours for daily series

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const maxAge = ttl !== undefined ? ttl : this.DEFAULT_TTL;
    const age = Date.now() - entry.timestamp;

    if (age > maxAge && maxAge !== Infinity) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new ApiCache();

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: string;
}

export interface DailyAdjustedData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
  dividendAmount: number;
  splitCoefficient: number;
}

export async function getDailyAdjusted(
  symbol: string
): Promise<DailyAdjustedData[] | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("Alpha Vantage API key not configured");
  }

  // Check cache first
  const cacheKey = `daily_${symbol}`;
  const cached = cache.get<DailyAdjustedData[]>(cacheKey, cache.DAILY_TTL);
  if (cached) {
    return cached;
  }

  const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 43200 } });
    const data = await response.json();

    if (data.Note) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) {
      return null;
    }

    const result = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      adjustedClose: parseFloat(values["5. adjusted close"]),
      volume: parseInt(values["6. volume"], 10),
      dividendAmount: parseFloat(values["7. dividend amount"]),
      splitCoefficient: parseFloat(values["8. split coefficient"]),
    }));

    // Cache the result
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Daily adjusted error:", error);
    throw error;
  }
}

export interface StockQuote {
  symbol: string;
  open: string;
  high: string;
  low: string;
  price: string;
  volume: string;
  latestTradingDay: string;
  previousClose: string;
  change: string;
  changePercent: string;
}

export async function searchStocks(
  query: string
): Promise<StockSearchResult[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("Alpha Vantage API key not configured");
  }

  if (!query || query.length < 2) {
    return [];
  }

  // Check cache first
  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = cache.get<StockSearchResult[]>(cacheKey, cache.SEARCH_TTL);
  if (cached) {
    return cached;
  }

  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
    query
  )}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 604800 } });
    const data = await response.json();

    if (data.Note) {
      // API rate limit message
      throw new Error("API rate limit exceeded. Please try again later.");
    }

    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    const bestMatches = data.bestMatches || [];
    let filteredResults = bestMatches
      .map((match: any) => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
        type: match["3. type"],
        region: match["4. region"],
        marketOpen: match["5. marketOpen"],
        marketClose: match["6. marketClose"],
        timezone: match["7. timezone"],
        currency: match["8. currency"],
        matchScore: match["9. matchScore"],
      }))
      .filter((stock: StockSearchResult) => {
        // Only include US stocks traded in USD (covers NASDAQ, NYSE, etc.)
        return stock.region === "United States" && stock.currency === "USD";
      });
    // If no results, fallback to all matches
    if (filteredResults.length === 0) {
      filteredResults = bestMatches.map((match: any) => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
        type: match["3. type"],
        region: match["4. region"],
        marketOpen: match["5. marketOpen"],
        marketClose: match["6. marketClose"],
        timezone: match["7. timezone"],
        currency: match["8. currency"],
        matchScore: match["9. matchScore"],
      }));
    }

    // Cache the result
    cache.set(cacheKey, filteredResults);
    return filteredResults;
  } catch (error) {
    console.error("Stock search error:", error);
    throw error;
  }
}

export async function getStockQuote(
  symbol: string
): Promise<StockQuote | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("Alpha Vantage API key not configured");
  }

  // Check cache first (shorter TTL for quotes - 1 minute)
  const cacheKey = `quote_${symbol}`;
  const cached = cache.get<StockQuote>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    const data = await response.json();

    if (data.Note) {
      // API rate limit message - return cached data if available even if expired
      const expiredCache = cache.get<StockQuote>(cacheKey, Infinity);
      if (expiredCache) {
        console.warn("API rate limit hit, using stale cache for", symbol);
        return expiredCache;
      }
      throw new Error("API rate limit exceeded. Please try again later.");
    }

    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    const quote = data["Global Quote"];
    if (!quote || !quote["01. symbol"]) {
      return null;
    }

    const result = {
      symbol: quote["01. symbol"],
      open: quote["02. open"],
      high: quote["03. high"],
      low: quote["04. low"],
      price: quote["05. price"],
      volume: quote["06. volume"],
      latestTradingDay: quote["07. latest trading day"],
      previousClose: quote["08. previous close"],
      change: quote["09. change"],
      changePercent: quote["10. change percent"],
    };

    // Cache the result
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Stock quote error:", error);
    throw error;
  }
}
