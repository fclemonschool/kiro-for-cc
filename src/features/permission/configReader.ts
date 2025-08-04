import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

export class ConfigReader {
    private configPath: string;
    private watchCallback?: () => void;

    constructor(private outputChannel: vscode.OutputChannel) {
        this.configPath = this.getSecureConfigPath();
    }

    /**
     * 보안이 강화된 설정 파일 경로 생성
     */
    private getSecureConfigPath(): string {
        const homeDir = os.homedir();
        
        // 경로 검증 - null bytes, path traversal 공격 방지
        if (homeDir.includes('\0') || homeDir.includes('..')) {
            throw new Error('Invalid home directory path detected');
        }
        
        const configPath = path.join(homeDir, '.claude.json');
        
        // 정규화된 경로가 홈 디렉토리 하위인지 확인
        const normalizedPath = path.normalize(configPath);
        const normalizedHome = path.normalize(homeDir);
        
        if (!normalizedPath.startsWith(normalizedHome)) {
            throw new Error('Config path is outside home directory');
        }
        
        return normalizedPath;
    }

    /**
     * 파일 경로 보안 검증
     */
    private validateFilePath(filePath: string): boolean {
        try {
            // null bytes 체크
            if (filePath.includes('\0')) {
                return false;
            }
            
            // 정규화된 경로가 예상 경로와 일치하는지 확인
            const normalizedPath = path.normalize(filePath);
            return normalizedPath === this.configPath;
        } catch (error) {
            this.outputChannel.appendLine(`[ConfigReader] Path validation error: ${error}`);
            return false;
        }
    }

    /**
     * JSON 파싱 보안 강화
     */
    private safeJsonParse(content: string): any {
        try {
            // 길이 제한 (1MB)
            if (content.length > 1024 * 1024) {
                throw new Error('Config file too large');
            }
            
            // 기본 형식 검증
            if (!content.trim().startsWith('{') || !content.trim().endsWith('}')) {
                throw new Error('Invalid JSON format');
            }
            
            return JSON.parse(content);
        } catch (error: any) {
            throw new Error(`JSON parsing failed: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * bypassPermissionsModeAccepted 필드 값 읽기
     */
    async getBypassPermissionStatus(): Promise<boolean> {
        try {
            // 파일 경로 보안 검증
            if (!this.validateFilePath(this.configPath)) {
                this.outputChannel.appendLine('[ConfigReader] Invalid config file path');
                return false;
            }

            // 파일 존재 여부 확인
            if (!fs.existsSync(this.configPath)) {
                this.outputChannel.appendLine(`[ConfigReader] Config file not found: ${this.configPath}`);
                return false;
            }

            // 파일 크기 검증 (최대 1MB)
            const stats = await fs.promises.stat(this.configPath);
            if (stats.size > 1024 * 1024) {
                this.outputChannel.appendLine('[ConfigReader] Config file too large');
                return false;
            }

            // 파일 내용 읽기
            const content = await fs.promises.readFile(this.configPath, 'utf8');

            // 안전한 JSON 파싱
            const config = this.safeJsonParse(content);

            // 권한 필드 값 반환, 기본값은 false
            const hasPermission = config.bypassPermissionsModeAccepted === true;

            return hasPermission;
        } catch (error: any) {
            this.outputChannel.appendLine(`[ConfigReader] Error reading config: ${error?.message || 'Unknown error'}`);
            return false;
        }
    }

    /**
     * bypassPermissionsModeAccepted 필드 값 설정
     */
    async setBypassPermission(value: boolean): Promise<void> {
        try {
            // 파일 경로 보안 검증
            if (!this.validateFilePath(this.configPath)) {
                throw new Error('Invalid config file path');
            }

            let config: any = {};

            // 파일이 존재하면 기존 설정 먼저 읽기
            if (fs.existsSync(this.configPath)) {
                // 파일 크기 검증
                const stats = await fs.promises.stat(this.configPath);
                if (stats.size > 1024 * 1024) {
                    throw new Error('Config file too large');
                }

                const content = await fs.promises.readFile(this.configPath, 'utf8');
                let parseSuccess = false;

                try {
                    config = this.safeJsonParse(content);
                    parseSuccess = true;
                } catch (e: any) {
                    // 파싱 실패 시 두 번 재시도
                    this.outputChannel.appendLine(`[ConfigReader] Failed to parse existing config, retrying...`);
                    for (let i = 0; i < 2; i++) {
                        try {
                            config = this.safeJsonParse(content);
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

            // 입력값 검증
            if (typeof value !== 'boolean') {
                throw new Error('Invalid permission value: must be boolean');
            }

            // 권한 필드 설정
            config.bypassPermissionsModeAccepted = value;

            // 디렉토리 존재 확인
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }

            // JSON 직렬화 검증
            const serializedConfig = JSON.stringify(config, null, 2);
            if (serializedConfig.length > 1024 * 1024) {
                throw new Error('Config data too large');
            }

            // 파일에 다시 쓰기 (2칸 들여쓰기 형식 유지)
            await fs.promises.writeFile(
                this.configPath,
                serializedConfig,
                'utf8'
            );

            this.outputChannel.appendLine(
                `[ConfigReader] Set bypassPermissionsModeAccepted to ${value}`
            );
        } catch (error: any) {
            this.outputChannel.appendLine(
                `[ConfigReader] Failed to set permission: ${error?.message || 'Unknown error'}`
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