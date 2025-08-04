# Kiro for Claude Code

[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/v/heisebaiyun.kiro-for-cc.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=heisebaiyun.kiro-for-cc)
[![Downloads](https://img.shields.io/vscode-marketplace/d/heisebaiyun.kiro-for-cc.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=heisebaiyun.kiro-for-cc)
[![GitHub stars](https://img.shields.io/github/stars/notdp/kiro-for-cc.svg?style=flat-square)](https://github.com/notdp/kiro-for-cc/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/notdp/kiro-for-cc.svg?style=flat-square)](https://github.com/notdp/kiro-for-cc/issues)

[English](./README.md) | [中文版](./README.zh-CN.md)

> [!IMPORTANT]
> **🎉 새로운 기능: 서브 에이전트 지원이 이제 사용 가능합니다!**  
> 서브 에이전트 기능을 통해 Claude Code의 워크플로우 능력이 향상되었습니다. 요구사항, 설계, 작업을 위한 전문 에이전트들을 사용하여 병렬 처리로 스펙을 생성하세요.

Claude Code에 스펙 주도 개발을 가져다주는 VSCode 확장 프로그램입니다. Claude Code의 강력한 AI 기능을 활용하면서 스펙과 스티어링 문서를 시각적으로 관리하세요.

**새로운 기능: 서브 에이전트로 SPEC 생성:**

1. 액티비티 바에서 Kiro for CC 아이콘을 클릭하세요
2. SPEC 뷰 헤더에서 "New Spec with Agents" 버튼(스파클 아이콘 ✨)을 클릭하세요
3. 기능 설명을 입력하세요
4. Claude가 자동으로:
   - 스펙 워크플로우 시스템 프롬프트를 로드합니다
   - 전문 에이전트들(요구사항, 설계, 작업)에게 작업을 위임합니다
   - 전용 컨텍스트 창으로 각 단계를 병렬 처리합니다
5. 에이전트들이 작업을 완료하면 결과를 검토하세요

<p align="center">
  <img src="screenshots/new-spec-with-agents.png" width="600" alt="New Spec with Agents">
</p>

> **참고**: 서브 에이전트는 알려진 버그로 인해 때때로 실행 시간이 길어질 수 있습니다. 호환성을 유지하기 위해 기존 방식(`+` 버튼)과 새로운 서브 에이전트 방식을 모두 제공합니다. 문제가 발생하면 기존 방식이 안정적으로 작동합니다.

## 기능

### 📝 SPEC 관리

- **스펙 생성**: Claude의 도움으로 요구사항, 설계, 작업 문서를 생성합니다
- **시각적 탐색기**: 사이드바에서 스펙을 탐색하고 관리합니다
- **스펙 워크플로우**: 요구사항 → 설계 → 작업의 단계별 검토 과정
- **새로운 기능: 서브 에이전트 지원**: 병렬 처리를 위한 전문 에이전트를 사용하여 스펙 생성

### 🤖 AGENT 관리

- **사용자 및 프로젝트 에이전트**: 사용자 및 프로젝트 레벨에서 Claude Code 에이전트를 보고 관리합니다
- **내장 에이전트**: 사전 구성된 스펙 워크플로우 에이전트들(요구사항, 설계, 작업, 판단 등)
- **에이전트 탐색기**: 구문 강조를 지원하는 에이전트 구성 탐색 및 편집

### 🎯 STEERING 관리

- **CLAUDE.md**: 전역/프로젝트별 가이드라인을 탐색하고 편집합니다
- **생성된 문서**: 제품, 기술, 구조 스티어링 문서

### 🔌 MCP 관리

- **MCP 서버**: 구성된 전역 및 워크스페이스 MCP 서버를 봅니다

### 🪝 HOOKS 관리

- **에이전트 훅**: Claude Code 훅을 봅니다

### ⚙️ 기타

- **설정 관리**: 중앙 집중식 구성

## 스크린샷

![Kiro for Claude Code Extension](./screenshots/image.png)

*이 확장 프로그램은 스펙, 스티어링 문서, MCP 서버, 훅 관리를 위한 조직화된 뷰가 있는 종합적인 사이드바 인터페이스를 제공합니다. 모든 Claude Code 개선 도구를 한 곳에서 사용할 수 있습니다.*

## 설치

### 사전 요구사항

1. **Claude Code 설치**: Claude Code가 설치되고 구성되어 있는지 확인하세요

2. **호환성**:

| 플랫폼                      | 지원 | 참고사항                           | 상태     |
| ------------------------- | ---- | -------------------------------- | -------- |
| macOS                     | ✅    | 완전 지원                         | 출시됨   |
| Linux                     | ✅    | 완전 지원                         | 출시됨   |
| Windows (WSL)             | ✅    | 자동 경로 변환으로 지원            | 출시됨   |
| Windows (CMD)             | ❌    | 지원되지 않음                     | 추후 결정 |
| Windows (PowerShell)      | ❌    | 지원되지 않음                     | 추후 결정 |
| Windows (MinTTY Git Bash) | ❌    | 지원되지 않음                     | 추후 결정 |

### 확장 프로그램 마켓플레이스에서

**VSCode 사용자:**

1. VSCode를 엽니다
2. 확장 프로그램으로 이동합니다 (Cmd+Shift+X)
3. "Kiro for Claude Code"를 검색합니다
4. 설치를 클릭합니다

또는 명령줄에서:

```bash
code --install-extension heisebaiyun.kiro-for-cc
```

**Cursor 사용자:**
확장 프로그램은 OpenVSX Registry에서 사용할 수 있습니다. Cursor에서:

1. 확장 프로그램으로 이동합니다
2. "Kiro for Claude Code"를 검색합니다
3. 설치를 클릭합니다

또는 명령줄에서:

```bash
cursor --install-extension heisebaiyun.kiro-for-cc
```

### VSIX 파일에서

[GitHub Releases](https://github.com/notdp/kiro-for-cc/releases/latest)에서 최신 `.vsix` 파일을 다운로드한 다음:

```bash
# VSCode
code --install-extension kiro-for-cc-{latest-version}.vsix

# Cursor
cursor --install-extension kiro-for-cc-{latest-version}.vsix
```

`{latest-version}`을 실제 버전 번호로 교체하세요. 예: `0.2.4`.

## 사용법

### 스펙 생성

**기존 방식:**
1. 액티비티 바에서 Kiro for CC 아이콘을 클릭합니다
2. SPEC 뷰에서 `+` 버튼을 클릭합니다
3. 기능 설명을 입력합니다
4. Claude가 요구사항 문서를 생성합니다
5. 설계로 진행하기 전에 검토하고 승인합니다
6. 설계가 완료된 후 작업을 생성합니다

### 스펙 워크플로우

1. **요구사항**: 빌드하고자 하는 것을 정의합니다
2. **설계**: 요구사항 승인 후 기술 설계를 생성합니다
3. **작업**: 설계 승인 후 구현 작업을 생성합니다
4. **구현**: 작업을 하나씩 실행합니다

### 스티어링 문서

프로젝트별 가이드를 생성합니다:

- ✨ 아이콘을 클릭하여 사용자 정의 스티어링을 생성합니다
- 초기 문서들(제품, 기술, 구조)을 생성합니다
- 문서들은 `.claude/steering/`에 저장됩니다

## 구성

설정은 `.claude/settings/kfc-settings.json`에 저장됩니다:

```json
{
  "paths": {
    "specs": ".claude/specs",
    "steering": ".claude/steering",
    "settings": ".claude/settings"
  },
  "views": {
    "specs": {
      "visible": true
    },
    "steering": {
      "visible": true
    },
    "mcp": {
      "visible": true
    },
    "hooks": {
      "visible": true
    },
    "settings": {
      "visible": false
    }
  }
}
```

## 워크스페이스 구조

확장 프로그램은 워크스페이스에 다음 구조를 생성합니다:

```plain
.claude/                      # 확장 프로그램 데이터 디렉토리
├── specs/                    # 기능 명세서
│   └── {spec-name}/
│       ├── requirements.md   # 빌드할 내용
│       ├── design.md        # 빌드 방법
│       └── tasks.md         # 구현 단계
├── agents/                  # Claude Code 에이전트
│   └── kfc/                 # 내장 에이전트 (자동 초기화)
│       ├── spec-requirements.md
│       ├── spec-design.md
│       ├── spec-tasks.md
│       ├── spec-judge.md
│       ├── spec-impl.md
│       ├── spec-test.md
│       └── spec-system-prompt-loader.md
├── steering/                # AI 가이드 문서
│   ├── product.md          # 제품 관례
│   ├── tech.md             # 기술 표준
│   └── structure.md        # 코드 조직
├── settings/
│   └── kfc-settings.json   # 확장 프로그램 설정
```

## 개발

### 사전 요구사항

- Node.js 16+
- VSCode 1.84.0+
- TypeScript 5.3.0+

### 설정

```bash
# 저장소 복제
git clone https://github.com/notdp/kiro-for-cc.git
cd kiro-for-cc

# 의존성 설치
npm install

# TypeScript 컴파일
npm run compile

# 감시 모드 (변경사항 시 자동 컴파일)
npm run watch
```

### 확장 프로그램 실행

1. VSCode에서 프로젝트를 엽니다
2. `F5`를 눌러 확장 개발 호스트를 시작합니다
3. 새 VSCode 창에서 확장 프로그램을 사용할 수 있습니다

### 빌드

```bash
# VSIX 패키지 빌드
npm run package

# 출력: kiro-for-cc-{latest-version}.vsix
```

### 프로젝트 구조

```plain
src/
├── extension.ts              # 확장 프로그램 진입점, 명령 등록
├── constants.ts              # 구성 상수
├── features/                 # 비즈니스 로직
│   ├── spec/
│   │   └── specManager.ts    # 스펙 생명주기 관리
│   ├── steering/
│   │   └── steeringManager.ts # 스티어링 문서 관리
│   └── agents/
│       └── agentManager.ts   # 에이전트 초기화 및 관리
├── providers/                # VSCode TreeDataProviders
│   ├── claudeCodeProvider.ts # Claude CLI 통합
│   ├── specExplorerProvider.ts
│   ├── steeringExplorerProvider.ts
│   ├── agentsExplorerProvider.ts    # 새로운 기능: 에이전트 탐색기
│   ├── hooksExplorerProvider.ts
│   ├── mcpExplorerProvider.ts
│   └── overviewProvider.ts
├── prompts/                  # AI 프롬프트 템플릿
│   ├── specPrompts.ts        # 스펙 생성 프롬프트
│   ├── steeringPrompts.ts    # 스티어링 문서 프롬프트
│   └── spec/
│       └── create-spec-with-agents.md # 새로운 기능: 서브 에이전트 워크플로우
├── resources/                # 내장 리소스
│   ├── agents/              # 사전 구성된 에이전트
│   └── prompts/             # 시스템 프롬프트
└── utils/
    └── configManager.ts      # 구성 관리
```

### 주요 아키텍처 개념

- **관리자 패턴**: 각 기능은 비즈니스 로직을 처리하는 관리자 클래스를 가집니다
- **제공자 패턴**: 트리 뷰는 `vscode.TreeDataProvider`를 확장합니다
- **명령 패턴**: 모든 명령은 `kfc.{feature}.{action}` 명명 규칙을 따릅니다
- **구성**: 유연성을 위해 `ConfigManager`를 통한 중앙 집중식 관리

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](./LICENSE)를 참조하세요