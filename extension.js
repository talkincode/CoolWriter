const vscode = require('vscode');
const crypto = require('crypto');
const { 
    callOpenAIWrite, 
    callOpenAICoding, 
    callOpenAISummaries, 
    callOpenAIGenMarpSlide 
} = require('./src/coolwriter');
const { getNoteList } = require("./src/notelist")
const nls = require('vscode-nls');
const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

const commands = {
    'coolwriter.aiwrite': localize('aiwrite.command.title', "Continue writing"),
    'coolwriter.coding': localize('coding.command.title', "Smart coding"),
    'coolwriter.summaries': localize('summaries.command.title', "Summarize selection"),
    'coolwriter.genslide': localize('genslide.command.title', "Create marp slide"),
    'coolwriter.notelist': localize('notelist.command.title', "Open note list"),
    'coolwriter.addNote': localize('addNote.command.title', "Add to note list"),
    'coolwriter.showCommands': localize('showCommands.command.title', "Show extension commands"),
    'coolwriter.openExtensionSettings': localize('openExtensionSettings.command.title', "Open extension settings"),
};


function activate(context) {
    ////////////////////////////////////////////////////////////////
    // register aiwrite command
    ////////////////////////////////////////////////////////////////
    let disposable = vscode.commands.registerCommand('coolwriter.aiwrite', async function () {

        let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        const withNoteLabel = "Writing with note"
        const feynmanStyle = "Writing Style: Sharp, Humorous, Insightful, Rebellious"
        const xiaoboStyle = "Writing Style: Intuitive, Humorous, Passionate, Creative"
        quickPick.placeholder = 'Please enter a writing prompt';
        quickPick.canSelectMany = true; // 允许多选
        quickPick.items = [
            { label: withNoteLabel, alwaysShow: true }, // 特殊项用于确认选择
            { label: feynmanStyle, alwaysShow: true }, // 费曼风格：直观，幽默，激情
            { label: xiaoboStyle, alwaysShow: true } // 王小波风格：犀利，幽默，深刻
        ];

        quickPick.onDidHide(() => cancel = true);
        quickPick.onDidAccept(async () => {
            let withNote = quickPick.selectedItems.find(item => item.label == withNoteLabel) !== undefined;
            const value = quickPick.value;
            let notes = []
            if (withNote) {
                notes = context.globalState.get('coolwriter.notes', []);
            }
            
            let writeStyle = ""
            if (quickPick.selectedItems.find(item => item.label == feynmanStyle) !== undefined) {
                writeStyle = feynmanStyle
            }
            if (quickPick.selectedItems.find(item => item.label == xiaoboStyle) !== undefined) {
                writeStyle = xiaoboStyle
            }

            let editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    let selection = editor.selection;
                    let selectedText = editor.document.getText(selection);
                    let insertPosition = selection.isEmpty ? selection.active : selection.end;
                    let beforeText = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), selection.start));
                    let afterText = editor.document.getText(new vscode.Range(
                        selection.end, new vscode.Position(editor.document.lineCount, 0)
                    ));

                    quickPick.busy = true;
                    const completion = await callOpenAIWrite(beforeText, afterText, selectedText, value, notes, writeStyle);
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

    ////////////////////////////////////////////////////////////////
    // register coding command
    ////////////////////////////////////////////////////////////////
    let disposableCoding = vscode.commands.registerCommand('coolwriter.coding', async function () {

        let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        const withNoteLabel = "Coding with note"
        quickPick.placeholder = 'Please enter a coding prompt';
        quickPick.canSelectMany = true; // 允许多选
        quickPick.items = [
            { label: withNoteLabel, alwaysShow: true }, // 特殊项用于确认选择
        ];

        quickPick.onDidHide(() => cancel = true);
        quickPick.onDidAccept(async () => {
            let withNote = quickPick.selectedItems.find(item => item.label == withNoteLabel) !== undefined;
            const value = quickPick.value;
            let notes = []
            if (withNote) {
                notes = context.globalState.get('coolwriter.notes', []);
            }
        

            let editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    let selection = editor.selection;
                    let selectedText = editor.document.getText(selection);
                    let insertPosition = selection.isEmpty ? selection.active : selection.end;
                    let beforeText = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), selection.start));
                    let afterText = editor.document.getText(new vscode.Range(
                        selection.end, new vscode.Position(editor.document.lineCount, 0)
                    ));

                    quickPick.busy = true;
                    const completion = await callOpenAICoding(beforeText, afterText, selectedText, value, notes);
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

    context.subscriptions.push(disposableCoding);

    ////////////////////////////////////////////////////////////////
    //  register summaries command
    ////////////////////////////////////////////////////////////////
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

    ///////////////////////////////////////////////////////////////////////////
    //  register summaries command
    ///////////////////////////////////////////////////////////////////////////
    let disposableGenSlide = vscode.commands.registerCommand('coolwriter.genslide', async function () {
        const withNoteLabel = "Writing with note"
        let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Please enter a slide prompt';
        quickPick.canSelectMany = true; // 允许多选
        quickPick.items = [
            { label: withNoteLabel, alwaysShow: true }, // 特殊项用于确认选择
        ];

        quickPick.onDidHide(() => cancel = true);
        quickPick.onDidAccept(async () => {
            let withNote = quickPick.selectedItems.find(item => item.label == withNoteLabel) !== undefined;
            const value = quickPick.value;
            let notes = []
            if (withNote) {
                notes = context.globalState.get('coolwriter.notes', []);
            }

            let editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    let insertPosition = new vscode.Position(0, 0); // 设置插入位置为文档开始位置

                    quickPick.busy = true;
                    const completion = await callOpenAIGenMarpSlide(value, notes);
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

    context.subscriptions.push(disposableGenSlide)

    let notelist;
    let initNoteList = () => {
        if (!notelist || notelist.disposed) {
            notelist = getNoteList(context);
            notelist.onDidDispose(() => {
                notelist = null;
            });
            notelist.webview.onDidReceiveMessage(
                message => {
                    console.log(message);
                    let notes = context.globalState.get('coolwriter.notes', []);
                    switch (message.command) {
                        case 'insertNoteContentIntoActiveEditor':
                            insertNoteContentIntoActiveEditor(message.content);
                            return;
                        case 'copyNote':
                            vscode.env.clipboard.writeText(message.content);
                            break;
                        case 'getNotes':
                            // 发送 notes 到 webview
                            notelist.webview.postMessage({
                                command: 'notes',
                                notes: notes,
                            });
                            break;
                        case "searchNotes":
                            // 搜索 notes
                            let searchResult = notes.filter(note => note.content.includes(message.query));
                            // 发送 searchResult 到 webview
                            notelist.webview.postMessage({
                                command: 'notes',
                                notes: searchResult,
                            });
                            break;
                        case 'deleteNote':
                            // 删除指定的 note
                            notes = notes.filter(note => note.id !== message.id);
                            // 保存 notes 到 globalState
                            context.globalState.update('coolwriter.notes', notes);
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
            notelist.reveal(vscode.ViewColumn.Beside);
        }
    };


    ////////////////////////////////////////////////////////////////
    // Register notelist command
    ////////////////////////////////////////////////////////////////
    let disposableNotelist = vscode.commands.registerCommand('coolwriter.notelist', function () {
        initNoteList()
    });

    context.subscriptions.push(disposableNotelist);

    ////////////////////////////////////////////////////////////////
    // Register addNote command
    ////////////////////////////////////////////////////////////////
    let disposableAddNote = vscode.commands.registerCommand('coolwriter.addNote', function () {
        initNoteList()
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let document = editor.document;
            let selection = editor.selection;
            let text = document.getText(selection);
            // 添加新的 note
            let note = {
                id: generateHash(text),
                title: getTitleFromText(text),
                content: text,
            }
            let notes = context.globalState.get('coolwriter.notes', []);
            notes.push(note);
            context.globalState.update('coolwriter.notes', notes);
            notelist.webview.postMessage({
                command: 'coolwriter.addNote',
                note: note,
            })
        }
    });

    context.subscriptions.push(disposableAddNote);

    ////////////////////////////////////////////////////////////////
    // Register showCommands command
    ////////////////////////////////////////////////////////////////
    context.subscriptions.push(vscode.commands.registerCommand('coolwriter.showCommands', async () => {
        // 获取所有命令
        const allCommands = await vscode.commands.getCommands(true);

        // 筛选出以 'coolwriter.' 为前缀的命令
        const filteredCommands = allCommands.filter(cmd => cmd.startsWith('coolwriter.'));

        // 创建Quick Pick项
        const quickPickItems = filteredCommands.map(cmd => ({
            label: commands[cmd],
            description: cmd// 你可以添加描述来帮助用户理解命令的作用
        }));

        // 显示Quick Pick列表
        const selected = await vscode.window.showQuickPick(quickPickItems, {
            title: "CoolWriter Commands",
            placeHolder: 'Select a command',
        });

        // 执行选中的命令
        if (selected) {
            vscode.commands.executeCommand(selected.description);
        }
    }));

    ////////////////////////////////////////////////////////////////
    // Register openExtensionSettings command
    ////////////////////////////////////////////////////////////////
    let disposableSettings = vscode.commands.registerCommand('coolwriter.openExtensionSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'coolwriter');
    });

    context.subscriptions.push(disposableSettings);

    ////////////////////////////////////////////////////////////////
    // Register onDidChangeConfiguration event
    ////////////////////////////////////////////////////////////////
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


function generateHash(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
}

function insertNoteContentIntoActiveEditor(content) {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        const position = activeEditor.selection.active; // 获取当前光标的位置
        activeEditor.edit(editBuilder => {
            editBuilder.insert(position, content); // 在当前光标的位置插入内容
        });
    }
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

function getTitleFromText(text) {
    if (text.length <= 20) {
        return text;
    } else {
        return text.substring(0, 20);
    }
}

function deactivate() { }





module.exports = {
    activate,
    deactivate
};

