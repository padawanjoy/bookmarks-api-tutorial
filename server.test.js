import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "./server.js";

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function post(base, body, raw = false) {
  return fetch(`${base}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? body : JSON.stringify(body),
  });
}

test("아직 아무것도 없으면 빈 목록을 돌려준다", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/bookmarks`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });
});

test("등록에 성공하면 201과 정리된 주소를 돌려준다", async () => {
  await withServer(async (base) => {
    const res = await post(base, { url: "Example.com/blog/", title: "예제 블로그" });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.url, "https://example.com/blog");
    assert.equal(body.title, "예제 블로그");
  });
});

test("등록한 북마크가 목록에 나온다", async () => {
  await withServer(async (base) => {
    await post(base, { url: "joyousgarage.com", title: "Padawan Joy" });
    const res = await fetch(`${base}/bookmarks`);
    const list = await res.json();
    assert.equal(list.length, 1);
    assert.equal(list[0].url, "https://joyousgarage.com");
  });
});

test("표기가 달라도 같은 주소면 중복으로 본다", async () => {
  await withServer(async (base) => {
    await post(base, { url: "example.com", title: "첫 번째" });
    const res = await post(base, { url: "https://Example.com/", title: "두 번째" });
    assert.equal(res.status, 409);
  });
});

test("title이 없으면 400을 돌려준다", async () => {
  await withServer(async (base) => {
    const res = await post(base, { url: "example.com" });
    assert.equal(res.status, 400);
  });
});

test("주소 형태가 아니면 400을 돌려준다", async () => {
  await withServer(async (base) => {
    const res = await post(base, { url: "이건 주소가 아닌데요", title: "메모" });
    assert.equal(res.status, 400);
  });
});

test("본문이 JSON이 아니면 400을 돌려준다", async () => {
  await withServer(async (base) => {
    const res = await post(base, "안녕하세요", true);
    assert.equal(res.status, 400);
  });
});
