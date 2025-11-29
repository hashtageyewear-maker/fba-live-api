const express = require("express");
const SellingPartnerAPI = require("amazon-sp-api");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("FBA Inventory API is running ✔️");
});

app.get("/fba-inventory", async (req, res) => {
  try {
    const sp = new SellingPartnerAPI({
      region: "eu", // INDIA => EU
      refresh_token: process.env.REFRESH_TOKEN,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: process.env.LWA_CLIENT_ID,
        SELLING_PARTNER_APP_CLIENT_SECRET: process.env.LWA_CLIENT_SECRET,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_SELLING_PARTNER_ROLE: process.env.AWS_SELLING_PARTNER_ROLE,
      },
      options: {
        auto_request_tokens: true,
        auto_request_throttled: true,
      },
    });

    const marketplace = "A21TJRUUN4KGV"; // Amazon India Marketplace ID
    let allData = [];
    let nextToken = null;

    do {
      const params = {
        details: true,
        granularityType: "Marketplace",
        granularityId: marketplace,
        marketplaceIds: [marketplace],
      };

      if (nextToken) params.nextToken = nextToken;

      const resAPI = await sp.callAPI({
        operation: "getInventorySummaries",
        endpoint: "fbaInventory",
        query: params,
      });

      allData = allData.concat(resAPI.inventorySummaries || []);
      nextToken = resAPI.nextToken || null;

    } while (nextToken);

    const result = allData.map((x) => ({
      asin: x.asin,
      sku: x.sellerSku,
      fnSku: x.fnSku,
      name: x.productName || "",
      fulfillable: x.inventoryDetails?.fulfillableQuantity ?? 0,
      reserved: x.inventoryDetails?.reservedQuantity?.totalReservedQuantity ?? 0,
      totalQty: x.totalQuantity ?? 0,
      updated: x.lastUpdatedTime,
    }));

    res.json({
      totalProducts: result.length,
      data: result,
    });

  } catch (err) {
    console.error("SP API ERROR:", err);
    res.status(500).json({ error: err.message || "Inventory fetch error" });
  }
});

app.listen(PORT, () => {
  console.log(`API running http://localhost:${PORT}`);
});
