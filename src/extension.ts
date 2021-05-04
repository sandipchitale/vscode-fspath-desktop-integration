'use strict';
import { ExtensionContext, window, commands, workspace, env, QuickPickItem, extensions} from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';


class FSPathItem implements QuickPickItem {
    constructor(public label: string, public description = '', public detail = '') {}
}

let extensionPath;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    extensionPath = context.extensionPath;

    let disposable;
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.explorer.copyName', copyName);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.explorer.copy', copyUri);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor.copyPath', copyEditorFilePath);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor.copyRelativePath', copyEditorFileRelativePath);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor.copy', copyEditorFile);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor-title.copy', copyEditorFile);
    context.subscriptions.push(disposable);

    disposable = commands.registerCommand('vscode-fspath-desktop-integration.explorer.explorer', explorerUri);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor.explorer', explorerEditorFile);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor-title.explorer', explorerEditorFile);
    context.subscriptions.push(disposable);

    disposable = commands.registerCommand('vscode-fspath-desktop-integration.explorer.terminal', terminalUri);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor.terminal', terminalEditorFile);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor-title.terminal', terminalEditorFile);
    context.subscriptions.push(disposable);

    disposable = commands.registerCommand('vscode-fspath-desktop-integration.explorer.external-terminal', externalTerminalUri);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor.external-terminal', externalTerminalEditorFile);
    context.subscriptions.push(disposable);
    disposable = commands.registerCommand('vscode-fspath-desktop-integration.editor-title.external-terminal', externalTerminalEditorFile);
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function copyName(uri) {
    if (uri && uri.scheme === 'file') {
        _copy(path.basename(uri.fsPath));
    }
}

function copyUri(uri) {
    if (uri && uri.scheme === 'file') {
        _copyPaths(uri.fsPath);
    }
}

function copyEditorFilePath() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _copy(activeEditor.document.fileName);
        }
    }
}

function copyEditorFileRelativePath() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
                _copy(path.relative(workspace.workspaceFolders[0].uri.fsPath, activeEditor.document.fileName));
            }
        }
    }
}

function copyEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _copyPaths(activeEditor.document.fileName);
        }
    }
}

function _copyPaths(fsPath) {
    window.showQuickPick(_generateQuickPickItems(fsPath),
    {
        placeHolder: 'Select path to copy'
    }).then((selectedItem) => {
        if (selectedItem) {
            _copy(selectedItem.label);
        }
    });
}

function explorerUri(uri) {
    if (uri && uri.scheme === 'file') {
        _explorerPaths(uri.fsPath);
    }
}

function explorerEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _explorerPaths(activeEditor.document.fileName);
        }
    }
}

function _explorerPaths(fsPath) {
    window.showQuickPick(_generateQuickPickItems(fsPath, true),
    {
        placeHolder: 'Select path to reveal in explorer'
    }).then((selectedItem) => {
        if (selectedItem) {
            _explorer(selectedItem.label);
        }
    });
}

function _explorer(fsPath) {
    if (os.platform() === 'win32') {
        const explorerProcess = child_process.spawn(
            'cmd',
            [
                '/C'
                ,'start'
                ,'explorer'
                ,'/e'
                ,','
                ,'/select'
                ,','
                ,fsPath
            ]);

        explorerProcess.on('exit', (code) => {
        });
    } else if (os.platform() === 'linux') {
        const explorerProcess = child_process.spawn(
            '/usr/bin/nautilus',
            [
                fsPath
            ]);

        explorerProcess.on('exit', (code) => {
        });
    } else if (os.platform() === 'darwin') {
        const explorerProcess = child_process.spawn(
            '/usr/bin/open',
            [
                '-a'
                ,'/System/Library/CoreServices/Finder.app'
                ,fsPath
            ]);

        explorerProcess.on('exit', (code) => {
        });
    }
}

function terminalUri(uri) {
    if (uri && uri.scheme === 'file') {
        _terminalPaths(uri.fsPath);
    }
}

function terminalEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _terminalPaths(activeEditor.document.fileName);
        }
    }
}

function _terminalPaths(fsPath) {
    window.showQuickPick(_generateQuickPickItems(fsPath, true),
    {
        placeHolder: 'Start terminal at path'
    }).then((selectedItem) => {
        if (selectedItem) {
            _terminal(selectedItem.label);
        }
    });
}

function _terminal(fsPath) {
    if (fs.statSync(fsPath).isFile()) {
        fsPath = path.dirname(fsPath);
    }

    const terminal = window.createTerminal({
        name: path.basename(fsPath),
        cwd: fsPath,
    });
    terminal.show();
}

function externalTerminalUri(uri) {
    if (uri && uri.scheme === 'file') {
        _externalTerminalPaths(uri.fsPath);
    }
}

function externalTerminalEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _externalTerminalPaths(activeEditor.document.fileName);
        }
    }
}

function _externalTerminalPaths(fsPath) {
    window.showQuickPick(_generateQuickPickItems(fsPath, true),
    {
        placeHolder: 'Start external terminal at path'
    }).then((selectedItem) => {
        if (selectedItem) {
            _externalTerminal(selectedItem.label);
        }
    });
}

function _externalTerminal(fsPath) {
    if (fs.statSync(fsPath).isFile()) {
        fsPath = path.dirname(fsPath);
    }

    if (os.platform() === 'win32') {
        const explorerProcess = child_process.spawn(
            'cmd',
            [
                '/K'
                ,'start'
                ,'cd'
                ,'/D'
                ,fsPath
            ]);

        explorerProcess.on('exit', (code) => {
        });
    } else if (os.platform() === 'linux') {
        const explorerProcess = child_process.spawn(
            'gnome-externalTerminal',
            [
                `--working-directory="${fsPath}"`
            ]);

        explorerProcess.on('exit', (code) => {
        });
    } else if (os.platform() === 'darwin') {
        const explorerProcess = child_process.spawn(
            '/usr/bin/osascript',
            [
                path.join(extensionPath, 'scripts', 'cdterminal.scpt')
                ,fsPath
            ]);

        explorerProcess.on('exit', (code) => {
        });
    }
}

function _generateQuickPickItems(fsPath: string, isOSPath = false): QuickPickItem[] {
    const quickPickItems = [];
    const altQuickPickItems = [];
    let parentPath = fsPath;
    let lastParentPath = undefined;
    while (parentPath !== lastParentPath) {
        lastParentPath = parentPath;
        if (parentPath === fsPath) {
            const isFile =  fs.statSync(parentPath).isFile();
            if (!isOSPath) {
                quickPickItems.push(new FSPathItem(path.basename(parentPath), 'Name'));
            }
            // quickPickItems.push(new FSPathItem(parentPath));
            if (!isOSPath) {
                if (isFile) {
                    const extName = path.extname(parentPath);
                    if (extName && extName.trim().length > 0) {
                        quickPickItems.push(new FSPathItem(path.basename(parentPath).substring(0, path.basename(parentPath).lastIndexOf('.')), 'Name sans extension'));
                        quickPickItems.push(new FSPathItem(extName.substring(1), 'Extension'));
                    }
                }
            }
        } else {
            quickPickItems.push(new FSPathItem(parentPath));
        }
        if (!isOSPath) {
            if (path.sep === '\\') {
                altQuickPickItems.push(new FSPathItem(parentPath.replace(/\\/g, '/')));
            } else {
                altQuickPickItems.push(new FSPathItem(parentPath.replace(/\//g, '\\')));
            }
        }
        parentPath = path.dirname(parentPath);
    }

    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
        workspace.workspaceFolders.forEach(workspaceFolder => {
            quickPickItems.push(new FSPathItem(workspaceFolder.uri.fsPath, 'Workspace folder'));
            if (!isOSPath) {
                if (path.sep === '\\') {
                    altQuickPickItems.push(new FSPathItem(workspaceFolder.uri.fsPath.replace(/\\/g, '/'), 'Workspace folder slashes'));
                } else {
                    altQuickPickItems.push(new FSPathItem(workspaceFolder.uri.fsPath.replace(/\//g, '\\'), 'Workspace folder backslashes'));
                }
            }
        });
    }

    quickPickItems.push(new FSPathItem(os.homedir(), 'User home dir'));
    if (!isOSPath) {
        if (path.sep === '\\') {
            altQuickPickItems.push(new FSPathItem(os.homedir().replace(/\\/g, '/'), 'User home dir slashes'));
        } else {
            altQuickPickItems.push(new FSPathItem(os.homedir().replace(/\//g, '\\'), 'User home dir backslashes'));
        }
    }
    quickPickItems.push(new FSPathItem(os.tmpdir(), 'Temp dir'));
    if (!isOSPath) {
        if (path.sep === '\\') {
            altQuickPickItems.push(new FSPathItem(os.tmpdir().replace(/\\/g, '/'), 'Temp dir slashes'));
        } else {
            altQuickPickItems.push(new FSPathItem(os.tmpdir().replace(/\//g, '\\'), 'Temp dir backslashes'));
        }
    }

    quickPickItems.push(...altQuickPickItems);
    return quickPickItems;
}

function _copy(item: string) {
    env.clipboard.writeText(item);
}
