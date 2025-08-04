const vscode = acquireVsCodeApi();

// Security constants
const MAX_MESSAGE_LENGTH = 200;
const SAFE_CHAR_PATTERN = /^[a-zA-Z0-9\s\.\,\!\?\-\(\)ㄱ-ㅎㅏ-ㅣ가-힣]*$/;
const VALID_COMMANDS = ['updateStatus'];
const VALID_STATUSES = ['verifying', 'failed', 'success'];
const VALID_ACTIONS = ['accept', 'cancel', 'openIssue'];

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
    if (!VALID_COMMANDS.includes(message.command)) {
        return { valid: false, reason: 'Command not allowed' };
    }
    
    // Command-specific validation
    if (message.command === 'updateStatus') {
        // Status validation
        if (!message.status || typeof message.status !== 'string') {
            return { valid: false, reason: 'Invalid status format' };
        }
        
        if (!VALID_STATUSES.includes(message.status)) {
            return { valid: false, reason: 'Invalid status value' };
        }
        
        // Message content validation
        if (message.message !== undefined) {
            if (typeof message.message !== 'string') {
                return { valid: false, reason: 'Invalid message format' };
            }
            
            // Length validation
            if (message.message.length > MAX_MESSAGE_LENGTH) {
                return { valid: false, reason: 'Message too long' };
            }
            
            // Character validation - only allow safe characters
            if (!SAFE_CHAR_PATTERN.test(message.message)) {
                return { valid: false, reason: 'Message contains invalid characters' };
            }
        }
    }
    
    return { valid: true };
}

// Secure action validation
function validateAction(action) {
    return typeof action === 'string' && VALID_ACTIONS.includes(action);
}

// Secure message posting with validation
function postSecureMessage(command) {
    if (!validateAction(command)) {
        console.error('Security violation: Invalid action attempted:', command);
        return;
    }
    
    vscode.postMessage({ command });
}

function handleAccept() {
    postSecureMessage('accept');
}

function handleCancel() {
    postSecureMessage('cancel');
}

function openIssue(event) {
    if (event) {
        event.preventDefault();
    }
    postSecureMessage('openIssue');
}

// Secure event delegation
function handleClick(event) {
    event.preventDefault();
    
    const target = event.target;
    const action = target.getAttribute('data-action');
    
    if (!validateAction(action)) {
        console.warn('Invalid action attempted:', action);
        return;
    }
    
    switch (action) {
        case 'accept':
            handleAccept();
            break;
        case 'cancel':
            handleCancel();
            break;
        case 'openIssue':
            openIssue(event);
            break;
        default:
            console.warn('Unhandled action:', action);
    }
}

// DOM Ready and Event Setup
document.addEventListener('DOMContentLoaded', function() {
    // Set up secure event delegation
    document.addEventListener('click', handleClick);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only handle specific keys to prevent unexpected behavior
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAccept();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    });
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