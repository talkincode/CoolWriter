const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getNoteList(context) {
    let panel = vscode.window.createWebviewPanel(
        'notelist', // viewType
        'Notelist', // title
        vscode.ViewColumn.Beside, // show in new column
        { enableScripts: true } // options
    );

    let htmlPath = path.join(context.extensionPath, 'src', "views", 'notelist.html'); 
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'receiveMessage') {
            // 在这里处理接收到的消息
            console.log(message.message)
        }
    }, undefined, context.subscriptions);

    return panel

}


module.exports = {
    getNoteList,
};