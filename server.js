import http from "node:http";

export function createServer() {
  const bookmarks = [];

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/bookmarks") {
        return json(res, 200, bookmarks);
      }

      if (req.method === "POST" && req.url === "/bookmarks") {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        const { url, title } = JSON.parse(raw);

        const bookmark = { url, title };
        bookmarks.push(bookmark);
        return json(res, 200, bookmark);
      }

      return json(res, 404, { error: "없는 주소입니다" });
    } catch {
      return json(res, 500, { error: "서버 오류" });
    }
  });
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
