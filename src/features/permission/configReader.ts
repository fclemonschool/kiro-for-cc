import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

export class ConfigReader {
    private configPath: string;
    private watchCallback?: () => void;

    constructor(private outputChannel: vscode.OutputChannel) {
        this.configPath = path.join(os.homedir(), '.claude.json');
    }

    /**
     * bypassPermissionsModeAccepted 필드 값 읽기
     */
    async getBypassPermissionStatus(): Promise<boolean> {
        try {
            // 파일 존재 여부 확인
            if (!fs.existsSync(this.configPath)) {
                this.outputChannel.appendLine(`[ConfigReader] Config file not found: ${this.configPath}`);
                return false;
            }

            // 파일 내용 읽기
            const content = await fs.promises.readFile(this.configPath, 'utf8');

            // JSON 파싱
            const config = JSON.parse(content);

            // 권한 필드 값 반환, 기본값은 false
            const hasPermission = config.bypassPermissionsModeAccepted === true;

            return hasPermission;
        } catch (error) {
            this.outputChannel.appendLine(`[ConfigReader] Error reading config: ${error}`);
            return false;
        }
    }

    /**
     * bypassPermissionsModeAccepted 필드 값 설정
     */
    async setBypassPermission(value: boolean): Promise<void> {
        try {
            let config: any = {};

            // 파일이 존재하면 기존 설정 먼저 읽기
            if (fs.existsSync(this.configPath)) {
                const content = await fs.promises.readFile(this.configPath, 'utf8');
                let parseSuccess = false;

                try {
                    config = JSON.parse(content);
                    parseSuccess = true;
                } catch (e) {
                    // 파싱 실패 시 두 번 재시도
                    this.outputChannel.appendLine(`[ConfigReader] Failed to parse existing config, retrying...`);
                    for (let i = 0; i < 2; i++) {
                        try {
                            config = JSON.parse(content);
                            parseSuccess = true;
                            break;
                        } catch (e) {
                            this.outputChannel.appendLine(`[ConfigReader] Retry ${i + 1} failed to parse config`);
                        }
                    }
                }

                // 여전히 실패하면 빈 객체로 작성
                if (!parseSuccess) {
                    this.outputChannel.appendLine(`[ConfigReader] All parse attempts failed, using empty config object`);
                    config = {};
                }
            }

            // 권한 필드 설정
            config.bypassPermissionsModeAccepted = value;

            // 디렉토리 존재 확인
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }

            // 파일에 다시 쓰기 (2칸 들여쓰기 형식 유지)
            await fs.promises.writeFile(
                this.configPath,
                JSON.stringify(config, null, 2),
                'utf8'
            );

            this.outputChannel.appendLine(
                `[ConfigReader] Set bypassPermissionsModeAccepted to ${value}`
            );
        } catch (error) {
            this.outputChannel.appendLine(
                `[ConfigReader] Failed to set permission: ${error}`
            );
            throw error;
        }
    }

    /**
     * 설정 파일 변화 모니터링
     */
    watchConfigFile(callback: () => void): void {
        // 콜백 저장
        this.watchCallback = callback;

        // fs.watchFile을 사용하여 파일 변화 모니터링
        // 테스트 결과 이것이 가장 신뢰할 수 있는 방법임
        fs.watchFile(this.configPath, { interval: 2000 }, (curr, prev) => {
            if (curr.mtime.getTime() !== prev.mtime.getTime()) {
                // 파일 변화 시 콜백 호출, 로그는 권한 변화 시에만 출력
                callback();
            }
        });

        this.outputChannel.appendLine(
            `[ConfigReader] Started watching config file: ${this.configPath}`
        );
    }

    /**
     * 리소스 정리
     */
    dispose(): void {
        // 파일 모니터링 중지
        if (this.watchCallback) {
            fs.unwatchFile(this.configPath);
            this.outputChannel.appendLine('[ConfigReader] Stopped watching config file');
        }
    }
}