const xbtInput = document.getElementById("xbtInput");
const btcInput = document.getElementById("btcInput");
const usdInput = document.getElementById("usdInput");

const xbtPriceElement = document.getElementById("xbtPrice");
const btcPriceElement = document.getElementById("btcPrice");
const usdPriceElement = document.getElementById("usdPrice");

const statusElement = document.getElementById("status");

let xbtUsdPrice = null;
let btcUsdPrice = null;

let updating = false;

function parseNumber(value) {
  if (typeof value !== "string") {
    return Number(value);
  }

  const normalized = value
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();

  if (normalized === "") {
    return 0;
  }

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function formatXbt(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });
}

function formatBtc(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });
}

function formatUsd(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatMarketPrice(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
}

function updateFromXbt() {
  if (updating || !xbtUsdPrice || !btcUsdPrice) {
    return;
  }

  updating = true;

  const xbt = parseNumber(xbtInput.value);
  const usd = xbt * xbtUsdPrice;
  const btc = usd / btcUsdPrice;

  btcInput.value = formatBtc(btc);
  usdInput.value = formatUsd(usd);

  updating = false;
}

function updateFromBtc() {
  if (updating || !xbtUsdPrice || !btcUsdPrice) {
    return;
  }

  updating = true;

  const btc = parseNumber(btcInput.value);
  const usd = btc * btcUsdPrice;
  const xbt = usd / xbtUsdPrice;

  xbtInput.value = formatXbt(xbt);
  usdInput.value = formatUsd(usd);

  updating = false;
}

function updateFromUsd() {
  if (updating || !xbtUsdPrice || !btcUsdPrice) {
    return;
  }

  updating = true;

  const usd = parseNumber(usdInput.value);
  const xbt = usd / xbtUsdPrice;
  const btc = usd / btcUsdPrice;

  xbtInput.value = formatXbt(xbt);
  btcInput.value = formatBtc(btc);

  updating = false;
}

function clearOtherInputs(input) {
  if (input.value === "") {
    if (input === xbtInput) {
      btcInput.value = "";
      usdInput.value = "";
    }

    if (input === btcInput) {
      xbtInput.value = "";
      usdInput.value = "";
    }

    if (input === usdInput) {
      xbtInput.value = "";
      btcInput.value = "";
    }
  }
}

xbtInput.addEventListener("input", () => {
  clearOtherInputs(xbtInput);
  updateFromXbt();
});

btcInput.addEventListener("input", () => {
  clearOtherInputs(btcInput);
  updateFromBtc();
});

usdInput.addEventListener("input", () => {
  clearOtherInputs(usdInput);
  updateFromUsd();
});

function extractPrice(data) {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data === "number") {
    return Number.isFinite(data) && data > 0 ? data : null;
  }

  if (typeof data === "string") {
    const value = Number(data);

    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const value = extractPrice(item);

      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    return null;
  }

  const possibleFields = [
    "price",
    "last",
    "lastPrice",
    "close",
    "value",
    "usd",
    "usdPrice",
    "priceUsd",
    "price_usd"
  ];

  for (const field of possibleFields) {
    if (data[field] !== undefined) {
      const value = Number(data[field]);

      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  if (data.data !== undefined) {
    const value = extractPrice(data.data);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  if (data.result !== undefined) {
    const value = extractPrice(data.result);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Market API returned HTTP ${response.status}`
    );
  }

  return response.json();
}

async function loadPrices() {
  statusElement.textContent = "Loading market rates...";

  try {
    const [pricesData, xbtData] = await Promise.all([
      fetchJson("https://neoxa.exchange/api/prices"),
      fetchJson(
        "https://neoxa.exchange/api/exchange/ticker/BTCB2_USDC"
      )
    ]);

    console.log("NeoxEX /api/prices:", pricesData);
    console.log("NeoxEX BTCB2_USDC:", xbtData);

    let btcPrice = extractPrice(pricesData);
    let xbtPrice = extractPrice(xbtData);

    if (!Number.isFinite(xbtPrice) || xbtPrice <= 0) {
      throw new Error("Invalid XBT price returned by NeoxEX");
    }

    if (!Number.isFinite(btcPrice) || btcPrice <= 0) {
      throw new Error("Invalid BTC price returned by NeoxEX");
    }

    xbtUsdPrice = xbtPrice;
    btcUsdPrice = btcPrice;

    xbtPriceElement.textContent =
      formatMarketPrice(xbtUsdPrice);

    btcPriceElement.textContent =
      formatMarketPrice(btcUsdPrice);

    usdPriceElement.textContent = "USD";

    statusElement.textContent = "Market rates loaded";

    updateFromXbt();
  } catch (error) {
    console.error("Market rates error:", error);

    xbtPriceElement.textContent = "Unavailable";
    btcPriceElement.textContent = "Unavailable";
    usdPriceElement.textContent = "Unavailable";

    statusElement.textContent = "Unable to load market rates";
  }
}

loadPrices();
