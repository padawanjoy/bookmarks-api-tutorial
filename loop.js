import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const TARGET = "server.js";
const MAX_FIXES = 5;
const MODEL = "gemini-2.5-flash";

if (!process.env.GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY가 없습니다. 저장소 Secrets에 등록했는지 확인해 주세요.");
  process.exit(1);
}

function runTests() {
  try {
    execSync("node --test server.test.js", { encoding: "utf8", stdio: "pipe" });
    return { pass: true, log: "" };
  } catch (error) {
    return { pass: false, log: `${error.stdout ?? ""}\n${error.stderr ?? ""}` };
  }
}

async function requestFix(log) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "당신은 Node.js 개발자입니다. server.test.js를 통과하도록 server.js를 고치는 일을 맡았습니다. " +
              "답변에는 수정한 server.js 전체를 자바스크립트 코드 블록 하나로만 작성하세요. " +
              "설명은 쓰지 말고, server.test.js는 절대 수정하지 마세요.",
          },
          {
            role: "user",
            content:
              `테스트 파일(server.test.js):\n\`\`\`js\n${readFileSync("server.test.js", "utf8")}\`\`\`\n\n` +
              `현재 코드(server.js):\n\`\`\`js\n${readFileSync(TARGET, "utf8")}\`\`\`\n\n` +
              `테스트 실패 로그:\n\`\`\`\n${log.slice(-4000)}\n\`\`\``,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`모델 호출에 실패했습니다: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

function extractCode(answer) {
  const match = answer.match(/```(?:js|javascript)?\s*\n([\s\S]*?)```/);
  return match ? match[1] : answer;
}

let result = runTests();
let fixes = 0;

while (!result.pass && fixes < MAX_FIXES) {
  fixes += 1;
  console.log(`테스트 실패. ${fixes}번째 수정을 요청합니다.`);
  console.log(result.log);

  const answer = await requestFix(result.log);
  writeFileSync(TARGET, extractCode(answer));
  result = runTests();
}

if (result.pass) {
  console.log(`테스트 통과. 수정 ${fixes}번으로 루프를 마칩니다.`);
} else {
  console.log(`${MAX_FIXES}번 고쳐도 통과하지 못했습니다. 로그를 확인해 주세요.`);
  process.exit(1);
}
