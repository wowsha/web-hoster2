let ramStorage = {}; // slug => html content

function generateSlug(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { content } = await jsonBody(req);
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Invalid content" });
      return;
    }

    // Generate unique slug (avoid collisions)
    let slug;
    do {
      slug = generateSlug();
    } while (ramStorage[slug]);

    ramStorage[slug] = content;

    res.status(200).json({ slug });
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
  }
}

// Helper to parse JSON body without built-in parser (Vercel disables it by default)
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
