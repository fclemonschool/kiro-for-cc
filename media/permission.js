const vscode = acquireVsCodeApi();

// Enhanced message validation with comprehensive security checks
function validateMessage(message) {
    // Basic structure validation
    if (!message || typeof message !== 'object') {
        return { valid: false, reason: 'Invalid message structure' };
    }
    
    // Command validation
    if (typeof message.command !== 'string' || message.command.length === 0) {
        return { valid: false, reason: 'Invalid command format' };
    }
    
    // Command whitelist validation
    const validCommands = ['updateStatus'];
    if (!validCommands.includes(message.command)) {
        return { valid: false, reason: 'Command not allowed' };
    }
    
    // Command-specific validation
    if (message.command === 'updateStatus') {
        // Status validation
        if (!message.status || typeof message.status !== 'string') {
            return { valid: false, reason: 'Invalid status format' };
        }
        
        const validStatuses = ['verifying', 'failed', 'success'];
        if (!validStatuses.includes(message.status)) {
            return { valid: false, reason: 'Invalid status value' };
        }
        
        // Message content validation
        if (message.message !== undefined) {
            if (typeof message.message !== 'string') {
                return { valid: false, reason: 'Invalid message format' };
            }
            
            // Length validation
            if (message.message.length > 200) {
                return { valid: false, reason: 'Message too long' };
            }
            
            // Character validation - only allow safe characters
            const safeCharPattern = /^[a-zA-Z0-9\s\.\,\!\?\-\(\)ㄱ-ㅎㅏ-ㅣ가-힣]*$/;
            if (!safeCharPattern.test(message.message)) {
                return { valid: false, reason: 'Message contains invalid characters' };
            }
        }
    }
    
    return { valid: true };
}

function handleAccept() {
    vscode.postMessage({
        command: 'accept'
    });
}

function handleCancel() {
    vscode.postMessage({
        command: 'cancel'
    });
}

function openIssue(event) {
    event.preventDefault();
    vscode.postMessage({
        command: 'openIssue'
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleAccept();
    } else if (e.key === 'Escape') {
        handleCancel();
    }
});

// Handle status updates from extension with enhanced validation
window.addEventListener('message', event => {
    const message = event.data;
    
    // Enhanced validation with early exit
    const validation = validateMessage(message);
    if (!validation.valid) {
        console.warn('Message validation failed:', validation.reason);
        return;
    }
    
    if (message.command === 'updateStatus') {
        const statusInfo = document.querySelector('.status-info');
        if (statusInfo) {
            // Generate safe display message
            let displayMessage = '';
            
            switch (message.status) {
                case 'verifying':
                    displayMessage = 'STATUS: Verifying permissions...';
                    statusInfo.style.color = 'var(--terminal-yellow)';
                    break;
                case 'failed':
                    // Use validated and sanitized message content
                    const failMessage = message.message || 'Verification failed';
                    displayMessage = 'STATUS: ' + failMessage;
                    statusInfo.style.color = 'var(--terminal-red)';
                    break;
                case 'success':
                    displayMessage = 'STATUS: Permission granted successfully!';
                    statusInfo.style.color = 'var(--terminal-green)';
                    break;
            }
            
            // Use textContent instead of innerHTML for security
            statusInfo.textContent = displayMessage;
        }
    }
});