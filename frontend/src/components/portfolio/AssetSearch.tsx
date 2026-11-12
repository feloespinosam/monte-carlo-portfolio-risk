import { useMemo, useState } from "react";
import type { AssetSearchProps } from "../../types/home";
import { filterSuggestions } from "../../utils/portfolio";

export function AssetSearch({
  selectedTickers,
  availableTickers,
  onAddTicker,
}: AssetSearchProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const suggestions = useMemo(
    () =>
      filterSuggestions(searchTerm, availableTickers, selectedTickers),
    [searchTerm, availableTickers, selectedTickers],
  );

  const handleAddTicker = (symbol: string) => {
    const wasAdded = onAddTicker(symbol);
    if (wasAdded) {
      setSearchTerm("");
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Type at least 2 letters to search NASDAQ / NYSE (e.g., AP, TS, NV)..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm("")}
          >
            ✕
          </button>
        )}
      </div>

      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map((item) => (
            <li
              key={item.symbol}
              onClick={() => handleAddTicker(item.symbol)}
              className="suggestion-item"
            >
              <div className="suggestion-info">
                <span className="ticker-badge">{item.symbol}</span>
                {item.sector && (
                  <span className="ticker-sector">{item.sector}</span>
                )}
              </div>
              <span className="ticker-action">+ Add to portfolio</span>
            </li>
          ))}
        </ul>
      )}

      {isDropdownOpen &&
        searchTerm.trim().length >= 2 &&
        suggestions.length === 0 && (
          <div className="no-suggestions">No matching assets available</div>
        )}
    </div>
  );
}
