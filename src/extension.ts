'use strict';
import { ExtensionContext, window, commands, workspace, env, QuickPickItem, Uri} from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

class FSPathItem implements QuickPickItem {
    constructor(public label: string, public description = '', public detail = '') {}
}

let extensionPath;

export function activate(context: ExtensionContext) {
    extensionPath = context.extensionPath;

    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.copyName', copyNameUri));
    // Explorer Paths submenu
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.copyPaths', copyPathsUri));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.explorerPaths', explorerPathsUri));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.terminalPaths', terminalPathsUri));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.externalTerminalPaths', externalTerminalPathsUri));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.openPaths', openPathsUri));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.explorer.reopenPaths', reopenPathsUri));

    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.copyName', copyNameEditorFile));
    // Editor Title Paths submenu
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.copyPaths', copyPathsEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.explorerPaths', explorerEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.terminalPaths', terminalEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.externalTerminalPaths', externalTerminalEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.openPaths', openPathsEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor-title.reopenPaths', reopenPathsEditorFile));

    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.copyName', copyNameEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.copyPath', copyPathEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.copyRelativePath', copyRelativePathEditorFile));
    // Editor Paths submenu
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.copyPaths', copyPathsEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.explorerPaths', explorerEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.terminalPaths', terminalEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.externalTerminalPaths', externalTerminalEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.openPaths', openPathsEditorFile));
    context.subscriptions.push(commands.registerCommand('vscode-fspath-desktop-integration.editor.reopenPaths', reopenPathsEditorFile));
}

export function deactivate() {
}

// Explorer
function copyNameUri(uri) {
    if (uri && uri.scheme === 'file') {
        _copy(path.basename(uri.fsPath));
    }
}

// Explorer Paths sub menu
function copyPathsUri(uri) {
    if (uri && uri.scheme === 'file') {
        _copyPaths(uri.fsPath);
    }
}

function explorerPathsUri(uri) {
    if (uri && uri.scheme === 'file') {
        _explorerPaths(uri.fsPath);
    }
}

function terminalPathsUri(uri) {
    if (uri && uri.scheme === 'file') {
        _terminalPaths(uri.fsPath);
    }
}

function externalTerminalPathsUri(uri) {
    if (uri && uri.scheme === 'file') {
        _externalTerminalPaths(uri.fsPath);
    }
}

function reopenPathsUri(uri) {
    openPathsUri(uri, true);
}

function openPathsUri(uri, reopen = false) {
    if (uri && uri.scheme === 'file') {
        _openPaths(uri.fsPath, reopen);
    }
}

// Editor Title
function copyNameEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _copy(path.basename(activeEditor.document.fileName));
        }
    }
}

function copyPathEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _copy(activeEditor.document.fileName);
        }
    }
}

function copyRelativePathEditorFile() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
                _copy(path.relative(workspace.workspaceFolders[0].uri.fsPath, activeEditor.document.fileName));
            }
        }
    }
}

// Editor Title Paths submenu
function copyPathsEditorFile() {
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


function reopenPathsEditorFile() {
    openPathsEditorFile(true);
}

function openPathsEditorFile(reopen = false) {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        if (activeEditor.document.uri.scheme === 'file') {
            _openPaths(activeEditor.document.fileName, reopen);
        }
    }
}

function _openPaths(fsPath, reopen) {
    window.showQuickPick(_generateQuickPickItems(fsPath, true),
    {
        placeHolder: 'Select path to reveal in explorer'
    }).then((selectedItem) => {
        if (selectedItem) {
            _open(selectedItem.label, reopen);
        }
    });
}

function _open(fsPath, reopen) {
    commands.executeCommand("vscode.openFolder", Uri.file(fsPath), !reopen);
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
            'gnome-terminal',
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
