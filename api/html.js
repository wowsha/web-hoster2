let ramStorage = {}; // slug → accumulated HTML content

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
      const { slug: incomingSlug, content, chunkIndex, totalChunks } = await jsonBody(req);
      if (typeof content !== "string") {
        return res.status(400).json({ error: "Invalid content" });
      }

      let slug = incomingSlug;
      if (!slug) {
        slug = generateSlug();
        ramStorage[slug] = "";
      }

      ramStorage[slug] += content;

      if (
        typeof chunkIndex === "number" &&
        typeof totalChunks === "number" &&
        chunkIndex === totalChunks - 1
      ) {
        const url = `/api/html?slug=${slug}`;
        return res.status(200).json({ slug, url });
      }

      return res.status(200).json({ slug });
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  } else if (req.method === "GET") {
    const slug = req.query.slug;
    if (!slug || !ramStorage[slug]) {
      return res.status(404).end("Not found");
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(ramStorage[slug]);
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
