const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

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

  const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url);
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

    return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
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

  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
    query
  )}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url);
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

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note) {
      // API rate limit message
      throw new Error("API rate limit exceeded. Please try again later.");
    }

    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    const quote = data["Global Quote"];
    if (!quote || !quote["01. symbol"]) {
      return null;
    }

    return {
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
  } catch (error) {
    console.error("Stock quote error:", error);
    throw error;
  }
}
