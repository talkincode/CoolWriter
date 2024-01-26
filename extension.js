const vscode = require('vscode');
const {callOpenAIWrite, callOpenAISummaries} = require('./src/coolwriter');

function activate(context) {
    let channel = vscode.window.createOutputChannel('AiWriter');
    let disposable = vscode.commands.registerCommand('coolwriter.aiwrite', async function () {
		let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = '请输入提示语句';
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
                    // 获取选择文本之前的文本
                    let beforeText = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), selection.start));
                    // 获取选择文本之后的文本
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

    //  注册第二个命令
    let disposable2 = vscode.commands.registerCommand('coolwriter.help', async function () {
        // vscode.window.showInputBox({ placeHolder: '请输入文本' }).then(value => {
        //     if (value !== undefined) {
        //         console.log('用户输入的文本是: ' + value);
        //     }
        // });
        // vscode.window.showInformationMessage('这是一个信息消息', '按钮1', '按钮2').then(selection => {
        //     if (selection) {
        //         console.log('用户选择了: ' + selection);
        //     }
        // });
        
        channel.appendLine('Hello, CoolWriter!');
        channel.show();
    });

    context.subscriptions.push(disposable2)

    //  注册第三个命令
    let disposable3 = vscode.commands.registerCommand('coolwriter.summaries', async function () {
		let cancel = false;
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = '请输入提示语句';
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
                        // 更新 insertPosition
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


}

function getNewPosition(originalPosition, newText) {
    let lines = newText.split('\n');
    let addedLines = lines.length - 1;
    let lastLineLength = lines[lines.length - 1].length;

    if (addedLines === 0) {
        // 没有新行，只更新字符位置
        return originalPosition.translate(0, lastLineLength);
    } else {
        // 有新行，更新行和字符位置
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
