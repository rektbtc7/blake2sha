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
  if (!data) {
    return null;
  }

  if (typeof data === "number") {
    return Number.isFinite(data) ? data : null;
  }

  if (typeof data === "string") {
    const value = Number(data);
    return Number.isFinite(value) ? value : null;
  }

  const possibleFields = [
    "price",
    "last",
    "lastPrice",
    "close",
    "value"
  ];

  for (const field of possibleFields) {
    if (data[field] !== undefined) {
      const value = Number(data[field]);

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  if (data.data) {
    return extractPrice(data.data);
  }

  return null;
}

async function loadPrices() {
  statusElement.textContent = "Loading market rates...";

  try {
    const response = await fetch("/api/prices", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Price request failed");
    }

    const data = await response.json();

    const xbtPrice = Number(data.xbtUsd);
    const btcPrice = Number(data.btcUsd);

    if (!Number.isFinite(xbtPrice) || xbtPrice <= 0) {
      throw new Error("Invalid XBT price");
    }

    if (!Number.isFinite(btcPrice) || btcPrice <= 0) {
      throw new Error("Invalid BTC price");
    }

    xbtUsdPrice = xbtPrice;
    btcUsdPrice = btcPrice;

    xbtPriceElement.textContent = formatMarketPrice(xbtUsdPrice);
    btcPriceElement.textContent = formatMarketPrice(btcUsdPrice);
    usdPriceElement.textContent = "USD";

    statusElement.textContent = "Market rates loaded";

    updateFromXbt();
  } catch (error) {
    console.error(error);

    xbtPriceElement.textContent = "Unavailable";
    btcPriceElement.textContent = "Unavailable";
    usdPriceElement.textContent = "Unavailable";

    statusElement.textContent = "Unable to load market rates";
  }
}

loadPrices();
