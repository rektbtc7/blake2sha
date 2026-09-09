module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const [pricesResponse, xbtResponse] = await Promise.all([
      fetch("https://neoxa.exchange/api/prices", {
        headers: {
          Accept: "application/json"
        }
      }),

      fetch("https://neoxa.exchange/api/exchange/ticker/BTCB2_USDC", {
        headers: {
          Accept: "application/json"
        }
      })
    ]);

    if (!pricesResponse.ok) {
      throw new Error(
        `NeoxEX prices request failed: ${pricesResponse.status}`
      );
    }

    if (!xbtResponse.ok) {
      throw new Error(
        `NeoxEX BTCB2 ticker request failed: ${xbtResponse.status}`
      );
    }

    const pricesData = await pricesResponse.json();
    const xbtData = await xbtResponse.json();

    const btcUsd = extractBtcUsd(pricesData);
    const xbtUsd = extractPrice(xbtData);

    if (!Number.isFinite(xbtUsd) || xbtUsd <= 0) {
      throw new Error("Invalid XBT price returned by NeoxEX");
    }

    if (!Number.isFinite(btcUsd) || btcUsd <= 0) {
      throw new Error("Invalid BTC price returned by NeoxEX");
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );

    return res.status(200).json({
      xbtUsd,
      btcUsd
    });
  } catch (error) {
    console.error("Market price error:", error);

    res.setHeader("Cache-Control", "no-store");

    return res.status(500).json({
      error: "Unable to retrieve market prices"
    });
  }
};

function extractBtcUsd(data) {
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
    "btcUsd",
    "BTCUSD",
    "BTC_USD",
    "btc_usd",
    "bitcoinUsd",
    "bitcoin_usd",
    "price",
    "last",
    "lastPrice",
    "close",
    "value"
  ];

  for (const field of possibleFields) {
    if (data[field] !== undefined) {
      const value = Number(data[field]);

      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  if (data.data) {
    const value = extractBtcUsd(data.data);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  if (data.BTC) {
    const value = extractBtcUsd(data.BTC);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

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

      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  if (data.data) {
    return extractPrice(data.data);
  }

  return null;
}
