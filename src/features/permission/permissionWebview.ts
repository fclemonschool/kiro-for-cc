import * as vscode from 'vscode';
import * as fs from 'fs';

// 콜백 인터페이스 정의
interface PermissionWebviewCallbacks {
    onAccept: () => Promise<boolean>;
    onCancel: () => void;
    onDispose: () => void;
}

export class PermissionWebview {
    public static currentPanel: vscode.WebviewPanel | undefined;
    private static messageDisposable: vscode.Disposable | undefined;
    private static disposeDisposable: vscode.Disposable | undefined;
    private static callbacks: PermissionWebviewCallbacks | undefined;
    private static outputChannel: vscode.OutputChannel;

    public static createOrShow(
        context: vscode.ExtensionContext, 
        callbacks: PermissionWebviewCallbacks,
        outputChannel?: vscode.OutputChannel
    ): void {
        // Use provided output channel or create a default one
        if (outputChannel) {
            this.outputChannel = outputChannel;
        } else if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('Kiro for Claude Code - Debug');
        }
        this.outputChannel.appendLine(
            `[PermissionWebview] createOrShow called, current state: ` +
            `hasPanel: ${!!PermissionWebview.currentPanel}, ` +
            `hasCallbacks: ${!!PermissionWebview.callbacks}, ` +
            `hasMessageDisposable: ${!!PermissionWebview.messageDisposable}, ` +
            `hasDisposeDisposable: ${!!PermissionWebview.disposeDisposable}`
        );
        
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Clean up previous event listeners
        if (PermissionWebview.messageDisposable) {
            PermissionWebview.messageDisposable.dispose();
            PermissionWebview.messageDisposable = undefined;
        }
        if (PermissionWebview.disposeDisposable) {
            PermissionWebview.disposeDisposable.dispose();
            PermissionWebview.disposeDisposable = undefined;
        }

        // If we already have a panel, show it
        if (PermissionWebview.currentPanel) {
            this.outputChannel.appendLine('[PermissionWebview] Revealing existing panel');
            PermissionWebview.currentPanel.reveal(column);
        } else {
            // Otherwise, create a new panel
            this.outputChannel.appendLine('[PermissionWebview] Creating new panel');
            try {
                const panel = vscode.window.createWebviewPanel(
                    'claudePermission',
                    'Claude Code Permission',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true,
                        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
                    }
                );

                PermissionWebview.currentPanel = panel;
                this.outputChannel.appendLine('[PermissionWebview] Panel created successfully');
                
                // Get path to media
                const mediaPath = vscode.Uri.joinPath(context.extensionUri, 'media');
                
                // Read HTML template from file
                const htmlPath = vscode.Uri.joinPath(mediaPath, 'permission.html').fsPath;
                let htmlContent = fs.readFileSync(htmlPath, 'utf8');
                
                // Convert CSS and JS file paths to webview URIs
                const cssUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'permission.css'));
                const jsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'permission.js'));
                
                // Replace placeholder tokens in HTML with webview URIs
                htmlContent = htmlContent.replace('{{CSS_URI}}', cssUri.toString());
                htmlContent = htmlContent.replace('{{JS_URI}}', jsUri.toString());
                
                // Set the webview's initial html content
                panel.webview.html = htmlContent;
            } catch (error) {
                this.outputChannel.appendLine(`[PermissionWebview] Failed to create panel: ${error}`);
                callbacks.onCancel();
                return;
            }
        }

        // Store callbacks
        PermissionWebview.callbacks = callbacks;
        
        const panel = PermissionWebview.currentPanel;
        if (!panel) {
            this.outputChannel.appendLine('[PermissionWebview] ERROR: No panel available after creation!');
            callbacks.onCancel();
            return;
        }
        this.outputChannel.appendLine('[PermissionWebview] Setting up message handlers');

            // Handle messages from the webview
            PermissionWebview.messageDisposable = panel.webview.onDidReceiveMessage(
                async message => {
                    // Enhanced input validation for security with detailed checks
                    if (!message || typeof message !== 'object') {
                        this.outputChannel.appendLine('[PermissionWebview] Invalid message format: not an object');
                        return;
                    }
                    
                    if (typeof message.command !== 'string' || message.command.length === 0) {
                        this.outputChannel.appendLine('[PermissionWebview] Invalid message format: missing or invalid command');
                        return;
                    }

                    // Validate command against whitelist with detailed logging
                    const validCommands = ['accept', 'cancel', 'openIssue'];
                    if (!validCommands.includes(message.command)) {
                        this.outputChannel.appendLine(`[PermissionWebview] Security violation: invalid command '${message.command}' received`);
                        return;
                    }

                    switch (message.command) {
                        case 'accept':
                            if (PermissionWebview.callbacks) {
                                const success = await PermissionWebview.callbacks.onAccept();
                                if (!success) {
                                    // Validate and sanitize status message before sending
                                    const statusMessage = '권한을 설정할 수 없습니다. 다시 시도해주세요.';
                                    
                                    // Additional validation for message length and content
                                    if (statusMessage.length > 200) {
                                        this.outputChannel.appendLine('[PermissionWebview] Warning: Status message too long, truncating');
                                    }
                                    
                                    // Send validated status update
                                    panel.webview.postMessage({
                                        command: 'updateStatus',
                                        status: 'failed',
                                        message: statusMessage.substring(0, 200)
                                    });
                                }
                                // 주의: webview는 Manager에서 제어하므로 여기서 닫지 않음
                            }
                            return;
                        case 'cancel':
                            this.outputChannel.appendLine('[PermissionWebview] Cancel clicked');
                            if (PermissionWebview.callbacks) {
                                PermissionWebview.callbacks.onCancel();
                            }
                            // 주의: webview는 Manager에서 제어하므로 여기서 닫지 않음
                            return;
                        case 'openIssue':
                            await vscode.env.openExternal(vscode.Uri.parse('https://github.com/notdp/kiro-for-cc/issues/3'));
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Reset when the current panel is closed
            PermissionWebview.disposeDisposable = panel.onDidDispose(
                () => {
                    this.outputChannel.appendLine('[PermissionWebview] Panel disposed via window close');
                    if (PermissionWebview.callbacks) {
                        PermissionWebview.callbacks.onDispose();
                    }
                    // 주의: 정리 작업은 Manager에서 제어
                },
                null,
                context.subscriptions
            );
    }

    /**
     * 현재 webview 패널을 강제로 닫기
     * 터미널을 통해 권한이 부여될 때 호출됨
     */
    public static close(): void {
        if (this.outputChannel) {
            this.outputChannel.appendLine(
                `[PermissionWebview] close called, current state: ` +
                `hasPanel: ${!!PermissionWebview.currentPanel}`
            );
        }
        
        if (PermissionWebview.currentPanel) {
            // Clean up event listeners
            if (PermissionWebview.messageDisposable) {
                PermissionWebview.messageDisposable.dispose();
                PermissionWebview.messageDisposable = undefined;
            }
            if (PermissionWebview.disposeDisposable) {
                PermissionWebview.disposeDisposable.dispose();
                PermissionWebview.disposeDisposable = undefined;
            }

            // Dispose the panel
            PermissionWebview.currentPanel.dispose();
            PermissionWebview.currentPanel = undefined;
            PermissionWebview.callbacks = undefined;
            
            if (this.outputChannel) {
                this.outputChannel.appendLine('[PermissionWebview] close cleanup complete');
            }
        }
    }

    // 외부 파일에서 읽어오므로 제거됨
}