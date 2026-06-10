import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Supports high payload transfers for massive synced sets
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const stateFilePath = path.join(process.cwd(), "csc_portal_state.json");

  // Endpoint to check status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // REST API: Load State
  app.get("/api/state", (req, res) => {
    try {
      if (fs.existsSync(stateFilePath)) {
        const fileContent = fs.readFileSync(stateFilePath, "utf-8");
        const parsed = JSON.parse(fileContent);
        console.log(`Loaded persisted state from server files. Orders: ${parsed.orders?.length || 0}`);
        return res.json(parsed);
      }
      console.log("No persisted state file found, defaulting to fallback client seeds.");
      res.json({ error: "no_persisted_state" });
    } catch (err: any) {
      console.error("Error reading server state file:", err);
      res.status(500).json({ error: "failed_to_read_state", details: err.message });
    }
  });

  // REST API: Save State
  app.post("/api/state", (req, res) => {
    try {
      const stateObj = req.body;
      if (!stateObj || typeof stateObj !== "object" || !stateObj.orders) {
        return res.status(400).json({ error: "Invalid state object structure" });
      }

      fs.writeFileSync(stateFilePath, JSON.stringify(stateObj, null, 2), "utf-8");
      console.log(`Saved operational state successfully on server. Orders Count: ${stateObj.orders.length}`);
      res.json({ status: "saved", timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error writing server state file:", err);
      res.status(500).json({ error: "failed_to_save_state", details: err.message });
    }
  });

  // REST API: Google Sheets Proxy (Bypasses CORS completely)
  app.get("/api/proxy-sheet", async (req, res) => {
    const { url, sheet } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Spreadsheet URL is required" });
    }

    try {
      const keyMatch = String(url).match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!keyMatch) {
        return res.status(400).json({ error: "Could not parse Google Sheet Key from URL" });
      }
      const key = keyMatch[1];
      const sheetName = sheet ? String(sheet) : "Sheet1";
      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${key}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

      console.log(`Node HTTP proxy fetching sheet [${sheetName}] from spreadsheet [${key}]`);
      
      const fetchResponse = await fetch(csvExportUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });

      if (!fetchResponse.ok) {
        throw new Error(`Google Sheets export returned status ${fetchResponse.status}`);
      }

      const csvData = await fetchResponse.text();
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(csvData);
    } catch (err: any) {
      console.error("Spreadsheet CSV proxy compilation error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch spreadsheet from Google servers" });
    }
  });

  // Integrate Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting dev server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static resources from compiled dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CSC Full-stack Operational server running on http://localhost:${PORT}`);
  });
}

startServer();
