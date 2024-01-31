const vscode = require('vscode');
const { callOpenAIWrite, callOpenAISummaries, callOpenAIGenMarpSlide } = require('./src/coolwriter');

const commands = {
    'coolwriter.aiwrite': 'Continue Writing',
    'coolwriter.summaries': 'Summarize Selected',
    'coolwriter.genslide': 'Create Marp Slide',
    'coolwriter.showCommands': 'Show Commands',
    'extension.openExtensionSettings': 'Open Extension Settings'
};


function activate(context) {
    // register aiwrite command
    let disposable = vscode.commands.registerCommand('coolwriter.aiwrite', async function () {

        let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Please enter a prompt';
        quickPick.onDidHide(() => cancel = true);
        quickPick.onDidAccept(async () => {
            const value = quickPick.value;
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    let selection = editor.selection;
                    let selectedText = editor.document.getText(selection);
                    let insertPosition = selection.isEmpty ? selection.active : selection.end;
                    let beforeText = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), selection.start));
                    let afterText = editor.document.getText(new vscode.Range(selection.end, new vscode.Position(editor.document.lineCount, 0)));

                    quickPick.busy = true;
                    const completion = await callOpenAIWrite(beforeText, afterText, selectedText, value);
                    for await (const chunk of completion) {
                        if (cancel) {
                            console.log('Operation cancelled by the user.');
                            break;
                        }
                        let newText = chunk.choices[0].delta.content;
                        await editor.edit(editBuilder => {
                            editBuilder.insert(insertPosition, newText);
                        });
                        insertPosition = getNewPosition(insertPosition, newText);
                    }
                } catch (error) {
                    console.error(error);
                    vscode.window.showErrorMessage(error.message);
                } finally {
                    quickPick.busy = false;
                    quickPick.hide();
                }
            }
        });
        quickPick.show();
    });

    context.subscriptions.push(disposable);

    //  register summaries command
    let disposable3 = vscode.commands.registerCommand('coolwriter.summaries', async function () {

        let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Please enter a prompt';
        quickPick.onDidHide(() => cancel = true);
        quickPick.onDidAccept(async () => {
            const value = quickPick.value;
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    let selection = editor.selection;
                    let selectedText = editor.document.getText(selection);
                    let insertPosition = selection.isEmpty ? selection.active : selection.end;

                    quickPick.busy = true;
                    const completion = await callOpenAISummaries(selectedText, value);

                    let startText = "\n\nSummary: "
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, startText);
                    });
                    insertPosition = getNewPosition(insertPosition, startText);

                    for await (const chunk of completion) {
                        if (cancel) {
                            console.log('Operation cancelled by the user.');
                            break;
                        }
                        let newText = chunk.choices[0].delta.content;
                        await editor.edit(editBuilder => {
                            editBuilder.insert(insertPosition, newText);
                        });
                        insertPosition = getNewPosition(insertPosition, newText);
                    }
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, "\n\n");
                    });
                } catch (error) {
                    console.error(error);
                    vscode.window.showErrorMessage(error.message);
                } finally {
                    quickPick.busy = false;
                    quickPick.hide();
                }
            }
        });
        quickPick.show();
    });

    context.subscriptions.push(disposable3)

    //  register summaries command
    let disposable4 = vscode.commands.registerCommand('coolwriter.genslide', async function () {

        let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Please enter a slide prompt';
        quickPick.onDidHide(() => cancel = true);
        quickPick.onDidAccept(async () => {
            const value = quickPick.value;
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    let insertPosition = new vscode.Position(0, 0); // 设置插入位置为文档开始位置

                    quickPick.busy = true;
                    const completion = await callOpenAIGenMarpSlide(value);
                    for await (const chunk of completion) {
                        if (cancel) {
                            console.log('Operation cancelled by the user.');
                            break;
                        }
                        let newText = chunk.choices[0].delta.content;
                        await editor.edit(editBuilder => {
                            editBuilder.insert(insertPosition, newText);
                        });
                        insertPosition = getNewPosition(insertPosition, newText);
                    }
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, "\n\n");
                    });
                } catch (error) {
                    console.error(error);
                    vscode.window.showErrorMessage(error.message);
                } finally {
                    quickPick.busy = false;
                    quickPick.hide();
                }
            }
        });
        quickPick.show();
    });

    context.subscriptions.push(disposable4)

    context.subscriptions.push(vscode.commands.registerCommand('coolwriter.showCommands', async () => {
        // 获取所有命令
        const allCommands = await vscode.commands.getCommands(true);

        // 筛选出以 'coolwriter.' 为前缀的命令
        const filteredCommands = allCommands.filter(cmd => cmd.startsWith('coolwriter.'));

        // 创建Quick Pick项
        const quickPickItems = filteredCommands.map(cmd => ({
            label: cmd,
            description: commands[cmd] // 你可以添加描述来帮助用户理解命令的作用
        }));

        // 显示Quick Pick列表
        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a command',
        });

        // 执行选中的命令
        if (selected) {
            vscode.commands.executeCommand(selected.label);
        }
    }));

    let disposableSettings = vscode.commands.registerCommand('coolwriter.openExtensionSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'coolwriter');
    });

    context.subscriptions.push(disposableSettings);

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        // 检查是否是你的扩展相关的配置更改
        if (e.affectsConfiguration('coolwriter.openaiApikey') || e.affectsConfiguration('coolwriter.openaiModel')) {
            // 提示用户是否重新加载窗口以应用更改
            vscode.window.showInformationMessage('Settings for "Coolwriter" have changed. Reload to apply?', 'Reload')
                .then(selection => {
                    if (selection === 'Reload') {
                        // 执行重新加载窗口的命令
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
        }
    }));
}

function getNewPosition(originalPosition, newText) {
    let lines = newText.split('\n');
    let addedLines = lines.length - 1;
    let lastLineLength = lines[lines.length - 1].length;

    if (addedLines === 0) {
        return originalPosition.translate(0, lastLineLength);
    } else {
        let newLine = originalPosition.line + addedLines;
        let newChar = addedLines === 0 ? originalPosition.character + lastLineLength : lastLineLength;
        return new vscode.Position(newLine, newChar);
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
