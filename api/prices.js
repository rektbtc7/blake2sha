module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const results = {};

    const pricesResponse = await fetch(
      "https://neoxa.exchange/api/prices",
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    results.pricesStatus = pricesResponse.status;
    results.pricesOk = pricesResponse.ok;
    results.pricesContentType =
      pricesResponse.headers.get("content-type");

    const pricesText = await pricesResponse.text();

    try {
      results.prices = JSON.parse(pricesText);
    } catch {
      results.prices = pricesText;
    }

    const xbtResponse = await fetch(
      "https://neoxa.exchange/api/exchange/ticker/BTCB2_USDC",
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    results.xbtStatus = xbtResponse.status;
    results.xbtOk = xbtResponse.ok;
    results.xbtContentType =
      xbtResponse.headers.get("content-type");

    const xbtText = await xbtResponse.text();

    try {
      results.xbt = JSON.parse(xbtText);
    } catch {
      results.xbt = xbtText;
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
