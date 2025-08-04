import * as vscode from 'vscode';
import { ConfigReader } from './configReader';
import { PermissionCache, IPermissionCache } from './permissionCache';
import { PermissionWebview } from './permissionWebview';
import { ClaudeCodeProvider } from '../../providers/claudeCodeProvider';
import { NotificationUtils } from '../../utils/notificationUtils';

export class PermissionManager {
    private cache: IPermissionCache;
    private configReader: ConfigReader;
    private permissionWebview?: vscode.WebviewPanel;
    private currentTerminal?: vscode.Terminal;
    private disposables: vscode.Disposable[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private outputChannel: vscode.OutputChannel
    ) {
        // ConfigReader와 PermissionCache 초기화
        this.configReader = new ConfigReader(outputChannel);
        this.cache = new PermissionCache(this.configReader, outputChannel);

        // 监听缓存的权限变更事件
        const eventDisposable = this.cache.event(async (hasPermission) => {
            this.outputChannel.appendLine(
                `[PermissionManager] Event received with hasPermission: ${hasPermission}`
            );
            if (hasPermission) {
                // 权限被授予
                this.outputChannel.appendLine(
                    '[PermissionManager] Permission granted detected, closing UI elements'
                );

                // 모든 UI 요소 닫기
                this.outputChannel.appendLine('[PermissionManager] Permission granted, closing UI elements');
                this.closeUIElements();

                // 显示成功通知
                NotificationUtils.showAutoDismissNotification(
                    '✅ Claude Code permissions detected and verified!'
                );
            } else {
                // 权限被撤销
                this.outputChannel.appendLine(
                    '[PermissionManager] Permission revoked detected, showing setup'
                );

                // 显示警告
                vscode.window.showWarningMessage(
                    'Claude Code permissions have been revoked. Please grant permissions again.'
                );

                // 显示权限设置界面
                await this.showPermissionSetup();
            }
        });

        this.disposables.push(eventDisposable);
    }

    /**
     * 初始化权限系统（扩展启动时调用）
     */
    async initializePermissions(): Promise<boolean> {
        this.outputChannel.appendLine('[PermissionManager] Initializing permissions...');

        // 总是启动文件监听，这样可以检测权限变化
        this.startMonitoring();

        // cache.refreshAndGet() 호출하여 권한 확인
        let hasPermission = await this.cache.refreshAndGet();

        if (hasPermission) {
            this.outputChannel.appendLine('[PermissionManager] Permissions already granted');
            return true;
        }

        // 如果无权限，先尝试显示设置界面
        this.outputChannel.appendLine('[PermissionManager] No permissions found, showing setup');

        // 第一次直接显示权限设置
        hasPermission = await this.showPermissionSetup();

        // 사용자가 webview에서 취소한 경우, 재시도 루프로 진입
        while (!hasPermission) {
            // 显示警告并提供重试选项
            const retry = await vscode.window.showWarningMessage(
                'Claude Code permissions not granted. The extension will not work. Please approve or uninstall.',
                'Try Again',
                'Uninstall'
            );

            if (retry === 'Try Again') {
                // 再次调用权限设置流程
                const granted = await this.showPermissionSetup();
                if (granted) {
                    hasPermission = true;
                }
            } else if (retry === 'Uninstall') {
                // 사용자가 Uninstall을 클릭함
                this.outputChannel.appendLine('[PermissionManager] User chose to uninstall');

                // 先显示确认对话框
                const confirm = await vscode.window.showWarningMessage(
                    'Are you sure you want to uninstall Kiro for Claude Code?',
                    'Keep It',
                    'Uninstall'
                );

                if (confirm === 'Uninstall') {
                    try {
                        // 执行卸载命令
                        await vscode.commands.executeCommand('workbench.extensions.uninstallExtension', 'heisebaiyun.kiro-for-cc');
                        this.outputChannel.appendLine('[PermissionManager] Uninstall command executed');
                    } catch (error) {
                        this.outputChannel.appendLine(`[PermissionManager] Failed to uninstall: ${error}`);
                    }
                    await vscode.commands.executeCommand('extension.open', 'heisebaiyun.kiro-for-cc');
                    break;
                }

            }
        }

        return hasPermission;
    }

    /**
     * 检查权限（使用缓存）
     */
    async checkPermission(): Promise<boolean> {
        return this.cache.get();
    }

    /**
     * 권한 부여 (WebView 호출)
     */
    async grantPermission(): Promise<boolean> {
        try {
            // ConfigReader 호출하여 권한 설정
            await this.configReader.setBypassPermission(true);

            // 刷新缓存
            await this.cache.refresh();

            // 记录日志
            this.outputChannel.appendLine(
                '[PermissionManager] Permission granted via WebView'
            );

            return true;
        } catch (error) {
            this.outputChannel.appendLine(
                `[PermissionManager] Failed to grant permission: ${error}`
            );
            return false;
        }
    }

    /**
     * 显示权限设置流程
     */
    async showPermissionSetup(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                this.outputChannel.appendLine('[PermissionManager] Starting permission setup flow...');
                this.outputChannel.appendLine('[PermissionManager] showPermissionSetup called');

                // ClaudeCodeProvider.createPermissionTerminal() 호출하여 터미널 생성
                this.currentTerminal = ClaudeCodeProvider.createPermissionTerminal();

                // 콜백 모드로 WebView 생성
                PermissionWebview.createOrShow(
                    this.context,
                    {
                        onAccept: async () => {
                            this.outputChannel.appendLine('[PermissionManager] User accepted, granting permission');
                            const success = await this.grantPermission();
                            if (success) {
                                // UI 요소 닫기
                                this.closeUIElements();
                                resolve(true);
                            }
                            return success;
                        },
                        onCancel: () => {
                            this.outputChannel.appendLine('[PermissionManager] User cancelled');
                            // UI 요소 닫기
                            this.closeUIElements();
                            resolve(false);
                        },
                        onDispose: () => {
                            this.outputChannel.appendLine('[PermissionManager] WebView disposed');
                            // 기타 UI 요소 닫기
                            if (this.currentTerminal) {
                                this.currentTerminal.dispose();
                                this.currentTerminal = undefined;
                            }
                            resolve(false);
                        }
                    },
                    this.outputChannel
                );

                // WebView 참조 저장
                this.permissionWebview = PermissionWebview.currentPanel;
                this.outputChannel.appendLine(
                    `[PermissionManager] WebView reference saved: ${this.permissionWebview ? 'Yes' : 'No'}`
                );
            } catch (error) {
                this.outputChannel.appendLine(
                    `[PermissionManager] Error in showPermissionSetup: ${error}`
                );
                resolve(false);
            }
        });
    }

    /**
     * 모든 UI 요소 닫기
     */
    private closeUIElements(): void {
        this.outputChannel.appendLine('[PermissionManager] Closing UI elements');

        // WebView 닫기
        if (this.permissionWebview) {
            PermissionWebview.close();
            this.permissionWebview = undefined;
        }

        // 关闭终端
        if (this.currentTerminal) {
            this.currentTerminal.dispose();
            this.currentTerminal = undefined;
        }
    }

    /**
     * 启动文件监听
     */
    startMonitoring(): void {
        this.outputChannel.appendLine('[PermissionManager] Starting file monitoring...');

        // configReader.watchConfigFile() 호출
        this.configReader.watchConfigFile(async () => {
            // 文件变化时刷新缓存
            await this.cache.refresh();
        });
    }

    /**
     * 권한 상태 재설정 (false로 설정)
     */
    async resetPermission(): Promise<boolean> {
        try {
            this.outputChannel.appendLine('[PermissionManager] Resetting permission to false...');

            // ConfigReader 호출하여 권한을 false로 설정
            await this.configReader.setBypassPermission(false);

            // 刷新缓存
            await this.cache.refresh();

            this.outputChannel.appendLine('[PermissionManager] Permission reset completed');

            // 权限被重置后会触发事件，自动显示设置界面
            return true;
        } catch (error) {
            this.outputChannel.appendLine(
                `[PermissionManager] Failed to reset permission: ${error}`
            );
            return false;
        }
    }

    /**
     * 清理资源
     */
    dispose(): void {
        // 모든 disposables 정리
        this.disposables.forEach(d => d.dispose());

        // ConfigReader 정리
        this.configReader.dispose();

        // WebView와 터미널 정리
        if (this.permissionWebview) {
            this.permissionWebview.dispose();
        }
        if (this.currentTerminal) {
            this.currentTerminal.dispose();
        }

        this.outputChannel.appendLine('[PermissionManager] Disposed');
    }
}