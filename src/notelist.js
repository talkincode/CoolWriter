const vscode = require('vscode');

function getNoteList(context) {
    let panel = vscode.window.createWebviewPanel(
        'notelist', // viewType
        'Notelist', // title
        vscode.ViewColumn.Beside, // show in new column
        { enableScripts: true } // options
    );

    let htmlContent = getHtmlViewContent();
    
    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'receiveMessage') {
            // 在这里处理接收到的消息
            console.log(message.message)
        }
    }, undefined, context.subscriptions);

    return panel

}


function getHtmlViewContent(){
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>NoteView</title>
        <style>
            body, html {
                height: 100%;
                margin: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f3f3f3;
            }
            .note-list-container {
                padding: 10px;
            }
            .note-item {
                background-color: #fff;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
                cursor: pointer;
            }
            .note-item-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            .note-item-summary {
                color: #666;
            }
            .actions {
                margin: 10px;
                text-align: right;
            }
            button {
                background-color: #818181; /* Dark Grey */
                border: none;
                color: white;
                border-radius: 7px;
                padding: 5px 10px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 12px;
                margin: 2px 2px;
                cursor: pointer;
                transition-duration: 0.4s;
            }
        
            button:hover {
                background-color: #333333; /* Darker Grey */
            }
            #search {
                width: 100%;
                height: 20px;
            }
        </style>
    </head>
    <body>
        <div class="actions">
            <input type="text" id="search" placeholder="Search notes..." />
        </div>
        <div class="note-list-container">
            <!-- Note items will be dynamically inserted here -->
        </div>
    
        <script>
    
            // 获取搜索框元素
            const search = document.getElementById('search');
    
            // 添加事件监听器
            search.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    // 获取搜索框的值
                    const query = search.value;
    
                    // 发送搜索请求
                    vscode.postMessage({
                        command: 'searchNotes',
                        query: query,
                    });
                }
            });
    
            // JavaScript functions will go here
            const vscode = acquireVsCodeApi();
            // addNote, deleteNote, and insertNoteContentIntoActiveEditor
            window.addEventListener('message', event => {
                const message = event.data; // The JSON data our extension sent
                switch (message.command) {
                    case 'coolwriter.addNote':
                        addNote(message.note);
                        break;
                    case 'notes':
                        const noteListContainer = document.querySelector('.note-list-container');
                        noteListContainer.innerHTML = ''; 
                        for (let note of message.notes) {
                            // 使用 addNote 方法来添加 note
                            addNote(note);
                        }
                        break;
                }
            });
    
    
            // Delete note from local
            function deleteNoteFromLocal(id) {
                vscode.postMessage({
                    command: 'deleteNote',
                    id: id,
                });
            }
                    
            function addNote(note) {
                const noteListContainer = document.querySelector('.note-list-container');
            
                // 创建一个新的 note item
                const noteItem = document.createElement('div');
                noteItem.draggable = true;
                noteItem.addEventListener('dragstart', dragStart);
                noteItem.addEventListener('dragover', dragOver);
                noteItem.addEventListener('drop', drop);
                noteItem.classList.add('note-item');
            
                // 设置 note item 的标题和内容
                const noteTitle = document.createElement('h2');
                noteTitle.textContent = note.title;
                noteItem.appendChild(noteTitle);
            
                const noteContent = document.createElement('p');
                noteContent.textContent = note.content;
                noteItem.appendChild(noteContent);
                
                // 创建一个Insert按钮
                const insertButton = document.createElement('button');
                insertButton.textContent = 'Insert';
                insertButton.addEventListener('click', function() {
                    insertNoteContentIntoActiveEditor(note.content);
                });
                noteItem.appendChild(insertButton);
    
                
                // 创建一个Copy按钮
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copy';
                copyButton.addEventListener('click', function() {
                    vscode.postMessage({
                        command: 'copyNote',
                        content: note.content,
                    });
                });
                noteItem.appendChild(copyButton);
            
    
                // 创建一个删除按钮
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', function() {
                    deleteNoteFromLocal(note.id); 
                    noteItem.remove();
                });
                noteItem.appendChild(deleteButton);
            
            
                // 将新的 note item 添加到 note list container
                noteListContainer.appendChild(noteItem);
            }
    
            let dragged;
    
            function dragStart(event) {
                dragged = event.target;
            }
    
            function dragOver(event) {
                event.preventDefault();
                if (event.target.className === "note") {
                    event.target.style.border = "1px solid #000";
                }
            }
    
            function drop(event) {
                event.preventDefault();
                if (event.target.className === "note") {
                    event.target.style.border = "";
                    const isMoveDown = (dragged.compareDocumentPosition(event.target) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
                    if (isMoveDown) {
                        if (event.target.nextSibling) {
                            event.target.parentNode.insertBefore(dragged, event.target.nextSibling);
                        } else {
                            event.target.parentNode.appendChild(dragged);
                        }
                    } else {
                        event.target.parentNode.insertBefore(dragged, event.target);
                    }
                }
            }
    
            
            // Note item click handler to insert content into active editor
            function insertNoteContentIntoActiveEditor(noteContent) {
                // 发送一个消息到扩展
                vscode.postMessage({
                    command: 'insertNoteContentIntoActiveEditor',
                    content: noteContent,
                });
            }
    
            function renderNotes() {
                // 发送一个消息到扩展来获取 notes
                vscode.postMessage({
                    command: 'getNotes',
                });
            }
    
            renderNotes();
        </script>
    </body>
    </html>
    `

}


module.exports = {
    getNoteList,
};