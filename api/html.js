let ramStorage = {}; // slug → accumulated HTML content

// Wipe RAM every 1 hour
setInterval(() => {
  ramStorage = {};
  console.log("RAM storage cleared.");
}, 60 * 60 * 1000); // 1 hour

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
    const { slug: incomingSlug, content, chunkIndex, totalChunks, fromUrl } = await jsonBody(req);

    if (fromUrl) {
      try {
        const parsedUrl = new URL(fromUrl);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return res.status(400).json({ error: "Only HTTP or HTTPS URLs are allowed" });
        }
        const response = await fetch(fromUrl);
        if (!response.ok) {
          return res.status(400).json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` });
        }
        const html = await response.text();
        const slug = generateSlug();
        ramStorage[slug] = html;
        const url = `/api/html?slug=${slug}`;
        return res.status(200).json({ slug, url });
      } catch (e) {
        console.error("Fetch from URL error:", e);
        return res.status(500).json({ error: "Failed to fetch from URL" });
      }
    }

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

    res.status(200).json({ slug });
  } else if (req.method === "GET") {
    const slug = req.query.slug;
    if (!slug || !ramStorage[slug]) {
      return res.status(404).send("Not found");
    }

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(ramStorage[slug]);
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

export const config = { api: { bodyParser: false } };
