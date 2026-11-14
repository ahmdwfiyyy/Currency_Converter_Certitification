const { useState, useMemo, useEffect, useRef } = React;

// Rates relative to 1 USD
const RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 156.7,
  MYR: 4.47,
  SGD: 1.34,
  AUD: 1.51,
};

const NAMES = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  MYR: "Malaysian Ringgit",
  SGD: "Singapore Dollar",
  AUD: "Australian Dollar",
};

const CURRENCIES = Object.keys(RATES);
const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

const SwapIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function CurrencyConverter() {
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [swapTurns, setSwapTurns] = useState(0);
  const [copied, setCopied] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const copyTimer = useRef(null);

  // Converted amounts for every currency, based only on amount + "from" currency.
  // Changing the "to" currency just picks a value from this memoized map.
  const convertedAmounts = useMemo(() => {
    const value = Number(amount) || 0;
    const inUsd = value / RATES[fromCurrency];
    const result = {};
    for (const code of CURRENCIES) {
      result[code] = inUsd * RATES[code];
    }
    return result;
  }, [amount, fromCurrency]);

  const converted = convertedAmounts[toCurrency].toFixed(2);
  const unitRate = (RATES[toCurrency] / RATES[fromCurrency]).toFixed(4);
  const isNegative = Number(amount) < 0;

  // Re-trigger the result highlight whenever the shown value changes
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [converted, toCurrency]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setSwapTurns((t) => t + 1);
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(`${converted} ${toCurrency}`);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <main className="cc-wrapper">
      <section className="cc-card" aria-labelledby="cc-title">
        <header className="cc-header">
          <span className="cc-badge">Live demo rates</span>
          <h1 id="cc-title">Currency Converter</h1>
          <p>Type an amount, pick your currencies, and watch it update.</p>
        </header>

        <div className="cc-field">
          <label className="cc-label" htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amount}
            aria-invalid={isNegative}
            aria-describedby="amount-help"
            className={isNegative ? "is-invalid" : ""}
            onChange={(e) => setAmount(e.target.value)}
          />
          <small id="amount-help" className={`cc-help ${isNegative ? "is-error" : ""}`}>
            {isNegative ? "Amounts below zero aren't real money - try a positive number." : "Or tap a quick amount:"}
          </small>
          <div className="cc-chips" role="group" aria-label="Quick amounts">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                className={`cc-chip ${Number(amount) === q ? "is-active" : ""}`}
                aria-pressed={Number(amount) === q}
                onClick={() => setAmount(q)}
              >
                {q.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="cc-row">
          <div className="cc-field">
            <label className="cc-label" htmlFor="from-currency">From</label>
            <select
              id="from-currency"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <small className="cc-sub">{NAMES[fromCurrency]}</small>
          </div>

          <button
            type="button"
            className="cc-swap"
            onClick={swap}
            aria-label="Swap currencies"
            title="Swap currencies"
            style={{ transform: `rotate(${swapTurns * 180}deg)` }}
          >
            <SwapIcon />
          </button>

          <div className="cc-field">
            <label className="cc-label" htmlFor="to-currency">To</label>
            <select
              id="to-currency"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <small className="cc-sub">{NAMES[toCurrency]}</small>
          </div>
        </div>

        <div className="cc-result">
          <span key={flashKey} className="cc-flash" aria-hidden="true" />
          <div className="cc-result-top">
            <span className="cc-label">Converted amount</span>
            <button
              type="button"
              className={`cc-copy ${copied ? "is-done" : ""}`}
              onClick={copyResult}
              aria-label={copied ? "Copied" : "Copy converted amount"}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="cc-output" id="converted-amount" aria-live="polite">
            {converted} {toCurrency}
          </p>
          <small className="cc-rate">
            1 {fromCurrency} = {unitRate} {toCurrency}
          </small>
        </div>

        <div className="cc-others">
          <span className="cc-label">Same amount in other currencies - tap to select</span>
          <ul className="cc-grid">
            {CURRENCIES.filter((c) => c !== fromCurrency).map((code) => (
              <li key={code}>
                <button
                  type="button"
                  className={`cc-tile ${code === toCurrency ? "is-active" : ""}`}
                  aria-pressed={code === toCurrency}
                  onClick={() => setToCurrency(code)}
                >
                  <span className="cc-tile-code">{code}</span>
                  <span className="cc-tile-value">
                    {convertedAmounts[code].toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
