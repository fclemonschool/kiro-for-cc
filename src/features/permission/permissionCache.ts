import * as vscode from 'vscode';
import { ConfigReader } from './configReader';

export interface IPermissionCache extends vscode.EventEmitter<boolean> {
    get(): Promise<boolean>;
    refresh(): Promise<void>;
    refreshAndGet(): Promise<boolean>;
}

export class PermissionCache extends vscode.EventEmitter<boolean> implements IPermissionCache {
    private cache?: boolean;

    constructor(
        private configReader: ConfigReader,
        private outputChannel: vscode.OutputChannel
    ) {
        super();
    }

    /**
     * 권한 상태 가져오기 (캐시 사용)
     */
    async get(): Promise<boolean> {
        // 캐시가 있으면 직접 반환
        if (this.cache !== undefined) {
            return this.cache;
        }

        // 그렇지 않으면 refreshAndGet 호출
        return this.refreshAndGet();
    }

    /**
     * 캐시 새로고침 (값 반환 안함)
     */
    async refresh(): Promise<void> {
        await this.refreshAndGet();
    }

    /**
     * 캐시 새로고침 후 최신 값 반환
     */
    async refreshAndGet(): Promise<boolean> {
        // 이전 값 저장
        const oldValue = this.cache;

        // ConfigReader에서 최신 상태 읽기
        this.cache = await this.configReader.getBypassPermissionStatus();

        // 권한 상태가 변경된 경우에만 로그 출력
        if (oldValue !== this.cache) {
            this.outputChannel.appendLine(
                `[PermissionCache] Permission changed: ${oldValue} -> ${this.cache}`
            );

            // 권한이 false에서 true로 변경된 경우, 이벤트 발생
            if (oldValue === false && this.cache === true) {
                this.outputChannel.appendLine(
                    '[PermissionCache] Permission granted! Firing event.'
                );
                this.fire(true);
            }

            // 권한이 true에서 false로 변경된 경우에도 이벤트 발생
            if (oldValue === true && this.cache === false) {
                this.outputChannel.appendLine(
                    '[PermissionCache] Permission revoked! Firing event.'
                );
                this.fire(false);
            }
        }

        return this.cache;
    }

}