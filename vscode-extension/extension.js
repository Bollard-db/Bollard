const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const http = require('http');

let confirmServer = null;
let confirmPortPromise = null;

function activate(context) {
    console.log('Bollard MCP Extension activated');

    // 1. Start a local HTTP server in the extension to handle human approvals via clipboard
    confirmPortPromise = new Promise((resolve, reject) => {
        try {
            confirmServer = http.createServer((req, res) => {
                if (req.method === 'POST' && req.url === '/request_pin') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk;
                    });
                    req.on('end', () => {
                        let sql = '';
                        try {
                            const payload = JSON.parse(body);
                            sql = payload.sql || '';
                        } catch (e) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Invalid JSON' }));
                            return;
                        }

                        // Generate a random 4-digit PIN
                        const pin = String(Math.floor(1000 + Math.random() * 9000));

                        // Copy the PIN to the user's clipboard
                        vscode.env.clipboard.writeText(pin).then(() => {
                            // Show a native VS Code toast notification in the bottom right corner
                            const msg = `Bollard Database Protection: Write query requested. The authorization PIN (${pin}) has been copied to your clipboard. Paste it in the chat to approve.`;
                            vscode.window.showInformationMessage(msg);
                            
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ pin }));
                        });
                    });
                } else {
                    res.writeHead(404);
                    res.end();
                }
            });

            // Listen on a random available port (0) bound to localhost
            confirmServer.listen(0, '127.0.0.1', () => {
                const port = confirmServer.address().port;
                console.log(`Bollard confirmation server listening on port: ${port}`);
                resolve(port);
            });
        } catch (err) {
            console.error('Failed to start Bollard confirmation server:', err);
            reject(err);
        }
    });

    // 2. Check if MCP Server Definition provider API is available in this VS Code/Cursor version
    if (!vscode.lm || !vscode.lm.registerMcpServerDefinitionProvider) {
        console.warn('Native MCP Server Definition Provider API is not supported in this version of VS Code/Cursor.');
        return;
    }

    const provider = vscode.lm.registerMcpServerDefinitionProvider('bollard.mcpServerProvider', {
        provideMcpServerDefinitions: async (token) => {
            const config = vscode.workspace.getConfiguration('bollard.mcpServer');
            if (!config.get('enabled', true)) {
                return [];
            }

            // Resolve python path
            let pythonPath = config.get('pythonPath', '').trim();
            if (!pythonPath) {
                // Try to auto-detect .venv in the open workspace
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const rootPath = workspaceFolders[0].uri.fsPath;
                    const venvPythonWin = path.join(rootPath, '.venv', 'Scripts', 'python.exe');
                    const venvPythonUnix = path.join(rootPath, '.venv', 'bin', 'python');

                    if (fs.existsSync(venvPythonWin)) {
                        pythonPath = venvPythonWin;
                    } else if (fs.existsSync(venvPythonUnix)) {
                        pythonPath = venvPythonUnix;
                    }
                }
            }

            // Fallback to searching in bollard-mcp package directory next to extension
            if (!pythonPath) {
                const extPath = context.extensionPath;
                // Move up to packages directory
                const venvPythonWin = path.join(path.dirname(extPath), '.venv', 'Scripts', 'python.exe');
                const venvPythonUnix = path.join(path.dirname(extPath), '.venv', 'bin', 'python');
                if (fs.existsSync(venvPythonWin)) {
                    pythonPath = venvPythonWin;
                } else if (fs.existsSync(venvPythonUnix)) {
                    pythonPath = venvPythonUnix;
                }
            }

            if (!pythonPath) {
                pythonPath = 'python'; // Fallback to environment PATH
            }

            // Resolve port from the promise
            let activePort = 0;
            try {
                if (confirmPortPromise) {
                    activePort = await confirmPortPromise;
                }
            } catch (err) {
                console.error('Error resolving confirmation server port:', err);
            }

            // Build environment variables mapped from settings
            const env = {
                ...process.env,
                BOLLARD_DEFAULT_MAX_ROWS: String(config.get('defaultMaxRows', 1000)),
                BOLLARD_DEBUG: String(config.get('debug', false)),
                BOLLARD_EXTENSION_PORT: String(activePort) // Send the port to the Python process!
            };

            // Return definition using McpStdioServerDefinition
            const mcpDef = new vscode.McpStdioServerDefinition(
                'Bollard Database MCP',
                pythonPath,
                ['-m', 'bollard_mcp.server'],
                env
            );

            console.log(`Registering Bollard MCP using Python path: ${pythonPath} and Bridge Port: ${activePort}`);
            return [mcpDef];
        }
    });

    context.subscriptions.push(provider);
}

function deactivate() {
    if (confirmServer) {
        confirmServer.close();
    }
}

module.exports = {
    activate,
    deactivate
};
