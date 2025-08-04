const vscode = acquireVsCodeApi();

// Input validation for commands
function isValidCommand(command) {
    const validCommands = ['accept', 'cancel', 'openIssue'];
    return validCommands.includes(command);
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

// Handle status updates from extension with validation
window.addEventListener('message', event => {
    const message = event.data;
    
    // Validate message structure
    if (!message || typeof message !== 'object' || !message.command) {
        return;
    }
    
    if (message.command === 'updateStatus') {
        const statusInfo = document.querySelector('.status-info');
        if (statusInfo && message.status) {
            // Validate status values
            const validStatuses = ['verifying', 'failed', 'success'];
            if (!validStatuses.includes(message.status)) {
                return;
            }

            // Sanitize message content by limiting length and using textContent
            let displayMessage = '';
            
            switch (message.status) {
                case 'verifying':
                    displayMessage = 'STATUS: Verifying permissions...';
                    statusInfo.style.color = 'var(--terminal-yellow)';
                    break;
                case 'failed':
                    // Limit message length and use textContent for safe assignment
                    const failMessage = message.message ? 
                        String(message.message).substring(0, 200) : 
                        'Verification failed';
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