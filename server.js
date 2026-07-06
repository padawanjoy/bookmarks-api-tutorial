import http from "node:http";
import { URL } from "node:url";

// Helper to send JSON responses
function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// Helper to read and parse JSON body, returns null on parse error
async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null; // Invalid JSON
  }
}

// Helper to normalize URL
function normalizeUrl(inputUrl) {
  try {
    let urlString = inputUrl;
    // Prepend https:// if no protocol is specified
    if (!urlString.match(/^[a-zA-Z]+:\/\//)) {
      urlString = `https://${urlString}`;
    }
    const url = new URL(urlString);
    url.hostname = url.hostname.toLowerCase();

    // Remove default ports if present
    if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
      url.port = '';
    }

    let pathname = url.pathname;
    // Remove trailing slash from pathname, unless it's the root path "/"
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    // If pathname is just "/", and there are no search params or hash,
    // remove it to get "https://example.com" instead of "https://example.com/"
    if (pathname === '/' && !url.search && !url.hash) {
        pathname = '';
    }

    // Reconstruct the URL string using url.origin and the modified pathname, search, hash
    return url.origin + pathname + url.search + url.hash;
  } catch (e) {
    return null; // Invalid URL format
  }
}

export function createServer() {
  const bookmarks = []; // In-memory storage for bookmarks

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/bookmarks") {
        return json(res, 200, bookmarks);
      }

      if (req.method === "POST" && req.url === "/bookmarks") {
        const body = await readJsonBody(req);

        // 본문이 JSON이 아니면 400을 돌려준다
        if (body === null || typeof body !== 'object') {
          return json(res, 400, { error: "Invalid JSON body" });
        }

        const { url, title } = body;

        // title이 없으면 400을 돌려준다
        if (!title || typeof title !== 'string' || title.trim() === '') {
          return json(res, 400, { error: "Title is required" });
        }

        // 주소 형태가 아니면 400을 돌려준다
        const normalizedUrl = normalizeUrl(url);
        if (normalizedUrl === null) {
          return json(res, 400, { error: "Invalid URL format" });
        }

        // 표기가 달라도 같은 주소면 중복으로 본다
        const existingBookmark = bookmarks.find(b => b.url === normalizedUrl);
        if (existingBookmark) {
          return json(res, 409, { error: "Bookmark with this URL already exists" });
        }

        const newBookmark = { url: normalizedUrl, title: title.trim() };
        bookmarks.push(newBookmark);

        // 등록에 성공하면 201과 정리된 주소를 돌려준다
        return json(res, 201, newBookmark);
      }

      // Fallback for unknown routes
      return json(res, 404, { error: "없는 주소입니다" });
    } catch (error) {
      // Catch any unexpected errors and return 500
      console.error("Server error:", error);
      return json(res, 500, { error: "서버 오류" });
    }
  });
}
