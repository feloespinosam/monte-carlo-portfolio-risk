from pathlib import Path
import pandas as pd

# 1. Read the original CSV
df = pd.read_csv(Path(__file__).parent / "tickers.csv")

# 2. Remove rows where sector is Uncategorized
df = df[
    df["sector"].str.strip().str.lower() != "uncategorized"
]

# 3. Remove duplicate symbols (keep first occurrence)
df = df.drop_duplicates(subset="symbol", keep="first")

# 4. Keep only symbol and sector columns
df = df[["symbol", "sector"]]

# 5. Export the cleaned dataset
df.to_json(
    "stocks_cleaned.json",
    orient="records",
    indent=4
)

print(f"Dataset cleaned successfully: {len(df)} stocks")
print(df.head())
