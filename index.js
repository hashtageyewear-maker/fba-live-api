const express = require("express");
const SellingPartnerAPI = require("amazon-sp-api");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/fba-inventory", async (req, res) => {
  try {
    const sp = new SellingPartnerAPI({
      region: "eu", // India = EU
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

    const response = await sp.callAPI({
      operation: "getInventorySummaries",
      endpoint: "fbaInventory",
      query: {
        details: true,
        granularityType: "Marketplace",
        granularityId: "A21TJRUUN4KGV",
        marketplaceIds: ["A21TJRUUN4KGV"],
      },
    });

    const items = (response.inventorySummaries || []).map((x) => ({
      asin: x.asin,
      sku: x.sellerSku,
      fnSku: x.fnSku,
      productName: x.productName || "",
      condition: x.condition || "",
      fulfillableQuantity: x.inventoryDetails?.fulfillableQuantity ?? 0,
      totalQuantity: x.totalQuantity ?? 0,
      reservedTotal:
        x.inventoryDetails?.reservedQuantity?.totalReservedQuantity ?? 0,
      lastUpdatedTime: x.lastUpdatedTime || "",
    }));

    res.json({ items });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: err.message || "Error fetching inventory" });
  }
});

app.listen(PORT, () => {
  console.log(`FBA Inventory API running on http://localhost:${PORT}`);
});
