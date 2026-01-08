"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import {
  searchStocks,
  getStockQuote,
  StockSearchResult,
} from "@/lib/stock-api";

interface StockSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (stock: StockSearchResult, currentPrice?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StockSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a stock...",
  disabled = false,
}: StockSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    const search = async () => {
      if (debouncedValue.length < 2) {
        setSearchResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchStocks(debouncedValue);
        setSearchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedValue]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = async (stock: StockSearchResult) => {
    try {
      // Fetch current price for the selected stock
      const quote = await getStockQuote(stock.symbol);
      const currentPrice = quote?.price || null;

      onSelect(stock, currentPrice);
      setIsOpen(false);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching stock price:", error);
      // Still select the stock even if price fetch fails
      onSelect(stock, null);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const showDropdown =
    value.length >= 2 &&
    (isLoading || (searchResults && searchResults.length > 0) || error);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showDropdown && isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {error ? (
            <div className="p-3 text-sm text-destructive">{error}</div>
          ) : isLoading ? (
            <div className="p-3 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((stock, index) => (
                <button
                  key={stock.symbol}
                  className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                  onClick={() => handleSelect(stock)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {stock.name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stock.region}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : value.length >= 2 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No stocks found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
