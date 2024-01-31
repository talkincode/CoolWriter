const vscode = require('vscode');
const { callOpenAIWrite, callOpenAISummaries, callOpenAIGenMarpSlide } = require('./src/coolwriter');

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

    //  register show commands command
    let disposableSC = vscode.commands.registerCommand('coolwriter.showCommands', async function () {
        vscode.commands.executeCommand('workbench.action.showCommands', 'coolwriter.');
    });

    context.subscriptions.push(disposableSC)

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
