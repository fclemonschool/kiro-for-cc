# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code (claude.ai/code)에게 가이드를 제공합니다.

## 프로젝트 개요

이것은 "Kiro for Claude Code"라는 VSCode 확장 프로그램으로, 구조화된 스펙 주도 개발 기능으로 Claude Code를 향상시킵니다. 이 확장 프로그램은 스펙(요구사항, 설계, 작업)과 스티어링 문서의 시각적 관리를 제공합니다.

## 개발 명령어

```bash
# 의존성 설치
npm install

# TypeScript 컴파일 (일회성)
npm run compile

# 개발용 감시 모드 (변경 시 자동 컴파일)
npm run watch

# 확장 프로그램을 .vsix 파일로 패키징
npm run package

# VSCode에서 실행
# VSCode에서 F5를 눌러 확장 개발 호스트 시작
```

## 아키텍처

### 프로젝트 구조

```plain
src/
├── extension.ts           # 확장 프로그램 진입점, 명령 등록
├── constants.ts          # 중앙 집중식 구성 상수
├── features/            # 기능별 비즈니스 로직
│   ├── spec/
│   │   └── specManager.ts      # 스펙 생명주기 관리
│   └── steering/
│       └── steeringManager.ts  # 스티어링 문서 관리
├── providers/           # VSCode TreeDataProviders
│   ├── claudeCodeProvider.ts   # Claude CLI 통합
│   ├── specExplorerProvider.ts # 스펙 트리 뷰
│   ├── steeringExplorerProvider.ts # 스티어링 트리 뷰
│   ├── hooksExplorerProvider.ts    # 훅 트리 뷰
│   ├── mcpExplorerProvider.ts      # MCP 서버 트리 뷰
│   └── overviewProvider.ts         # 설정 개요
├── prompts/            # AI 프롬프트 템플릿
│   ├── specPrompts.ts          # 스펙 생성 프롬프트
│   └── steeringPrompts.ts      # 스티어링 문서 프롬프트
└── utils/              # 유틸리티 함수
    └── configManager.ts        # 구성 관리
```

### 핵심 구성 요소

1. **확장 진입점** (`src/extension.ts`): 모든 명령을 등록하고 제공자를 초기화합니다
2. **기능 관리자** (`src/features/`): 스펙과 스티어링 문서를 위한 비즈니스 로직
3. **제공자** (`src/providers/`): UI 뷰를 위한 VSCode TreeDataProviders
4. **프롬프트** (`src/prompts/`): 스펙 생성을 위한 AI 프롬프트 템플릿

### 주요 패턴

- **관리자 패턴**: 각 기능은 파일 작업과 비즈니스 로직을 처리하는 관리자 클래스를 가집니다
- **제공자 패턴**: 각 트리 뷰는 `vscode.TreeDataProvider`를 확장하는 제공자 클래스를 가집니다
- **명령 등록**: 모든 명령은 `activate()`에서 `kfc.{feature}.{action}` 패턴으로 등록됩니다

### 데이터 구조

사용자 데이터는 워크스페이스 `.claude/` 디렉토리에 저장됩니다:

```plain
.claude/
├── specs/{spec-name}/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── steering/*.md
└── settings/kfc-settings.json
```

## 스펙 워크플로우 구현

스펙 워크플로우는 다음 상태를 따릅니다:

1. 요구사항 → 검토 → 설계
2. 설계 → 검토 → 작업
3. 작업 → 검토 → 완료

각 전환은 명시적인 사용자 승인이 필요합니다. 워크플로우는 `specPrompts.ts`에서 구현되고 스펙 에이전트 시스템 프롬프트에 의해 적용됩니다.

## Claude Code 통합

확장 프로그램은 `ClaudeCodeProvider`를 통해 Claude CLI와 통합됩니다:

- VS Code 터미널을 통해 명령 전송
- 긴 프롬프트를 위한 임시 파일 사용
- 컨텍스트 주입을 위한 시스템 프롬프트 지원
- 터미널 명령은 다음 형식으로 구성됩니다: `claude [options] < promptFile`

## 테스트 및 디버깅

현재 claudeCodeProvider의 62번째 줄에는 테스트 echo 명령이 있습니다:

```typescript
let command = `echo "HELLO WORLD"`;
```

이는 테스트가 완료되면 실제 Claude CLI 통합으로 교체되어야 합니다.

## 중요한 구현 사항

1. **파일 작업**: 항상 `vscode.Uri`와 워크스페이스 상대 경로를 사용하세요
2. **트리 업데이트**: 데이터 변경 후 제공자에서 `refresh()`를 호출하세요
3. **오류 처리**: 모든 파일 작업에는 try-catch 블록이 있어야 합니다
4. **사용자 프롬프트**: 사용자 입력을 위해 `vscode.window.showInputBox()`를 사용하세요
5. **컨텍스트 메뉴**: `package.json`의 `contributes.menus` 아래에 정의됩니다

## 확장 지점

- **새로운 관리자**: 기존 패턴을 따라 `src/features/`에 추가
- **새로운 제공자**: `TreeDataProvider`를 확장하여 `src/providers/`에 추가
- **새로운 명령**: `extension.ts`에서 등록하고 `package.json`에 추가
- **새로운 프롬프트**: AI 지원 기능을 위해 `src/prompts/`에 추가