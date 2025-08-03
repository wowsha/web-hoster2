import { ramStorage } from "./upload.js"; // We'll expose ramStorage from upload.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  const { slug } = req.query;

  if (!slug || !ramStorage[slug]) {
    res.status(404).end("Not found");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(ramStorage[slug]);
}
