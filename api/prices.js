module.exports = async function handler(req, res) {
  try {
    const [xbtResponse, btcResponse] = await Promise.all([
      fetch("https://neoxa.exchange/api/exchange/ticker/BTCB2_USDC", {
        headers: {
          Accept: "application/json"
        }
      }),
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {
        headers: {
          Accept: "application/json"
        }
      })
    ]);

    if (!xbtResponse.ok) {
      throw new Error("Neoxa Exchange request failed");
    }

    if (!btcResponse.ok) {
      throw new Error("Binance request failed");
    }

    const xbtData = await xbtResponse.json();
    const btcData = await btcResponse.json();

    const xbtUsd = extractPrice(xbtData);
    const btcUsd = extractPrice(btcData);

    if (!Number.isFinite(xbtUsd) || xbtUsd <= 0) {
      throw new Error("Invalid XBT price returned by Neoxa Exchange");
    }

    if (!Number.isFinite(btcUsd) || btcUsd <= 0) {
      throw new Error("Invalid BTC price returned by Binance");
    }

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      xbtUsd,
      btcUsd
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to retrieve market prices"
    });
  }
};

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
