let ramStorage = {}; // slug → HTML content

function generateSlug(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { content } = await jsonBody(req);
      if (!content || typeof content !== "string" || !content.trim()) {
        res.status(400).json({ error: "Invalid content" });
        return;
      }

      let slug;
      do {
        slug = generateSlug();
      } while (ramStorage[slug]);

      ramStorage[slug] = content;

      const url = `/api/html?slug=${slug}`;
      res.status(200).json({ slug, url });
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
    }
  } else if (req.method === "GET") {
    const slug = req.query.slug;
    if (!slug || !ramStorage[slug]) {
      res.status(404).end("Not found");
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(ramStorage[slug]);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

function jsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}
