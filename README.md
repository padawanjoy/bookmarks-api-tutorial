# loop-engineering-template

블로그 글 [루프 엔지니어링, 직접 만들어보며 이해하기](https://joyousgarage.com/writing/loop-engineering-tutorial)의 실습을 위한 템플릿 저장소입니다.

글에서는 GitHub Actions와 Gemini API로, 정해진 시각마다 저장소를 스스로 점검하고 고치고 커밋까지 남기는 작은 루프를 만듭니다. 이 저장소는 그 루프가 다룰 대상, 그러니까 실습 재료를 담고 있어요.

블로그: [joyousgarage.com](https://joyousgarage.com)

## 담긴 파일

| 파일 | 역할 |
|------|------|
| `server.test.js` | 서버가 갖춰야 할 동작을 적어둔 테스트. 루프가 목표로 삼는 기준 |
| `server.js` | 고칠 대상. 일부러 허술하게 만들어둔 서버 코드 |
| `package.json` | 테스트 실행 설정 |

`server.js`는 처음부터 허술하게 두었습니다. 테스트 일곱 개 중 하나만 통과하고 여섯 개는 실패해요. 루프가 이 실패를 발견하고 고쳐 나가는 과정을 보는 것이 실습의 목적입니다.

## 쓰는 법

위쪽 **Use this template** 버튼으로 내 계정에 저장소를 하나 만든 뒤, 글을 따라 `loop.js`와 `.github/workflows/loop.yml` 두 파일을 직접 추가하면 루프가 완성됩니다. 자세한 순서는 글에 있습니다.
