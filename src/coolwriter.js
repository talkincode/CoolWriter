const OpenAI = require('openai');
const vscode = require('vscode');

/**
 * get openai config
 * @returns {Object} - The OpenAI configuration object containing the API key and model.
 */
function getOpenaiConfig(){
    let config = vscode.workspace.getConfiguration('coolwriter');
    let result = {
        "openaiApikey" : config.get('openaiApikey'),
        "openaiModel" : config.get('openaiModel')
    }
    if (!result.openaiApikey){
        result.openaiApikey = process.env.OPENAI_API_KEY || "nokey";
    }
    if (!result.openaiModel){
        result.openaiModel = "gpt-4-turbo-preview";
    }
    return result
}

/**
 * get teamsgpt config
 * @returns {Object} - The teamsgpt configuration object containing the API endpoint and token.
 */
function getTeamsgptConfig(){
    let config = vscode.workspace.getConfiguration('coolwriter');
    let result = {
        "teamsgptApiEndpoint" : config.get('teamsgptApiEndpoint'),
        "teamsgptApiToken" : config.get('teamsgptApiToken')
    }
    return result
}

const oaicfg = getOpenaiConfig()
const openai = new OpenAI({apiKey: oaicfg.openaiApikey});

/**
 * Call OpenAI to generate content based on the provided context and prompt.
 * @param {string} beforeText - The text before the selected text.
 * @param {string} afterText - The text after the selected text.
 * @param {string} selectedText - The selected text.
 * @param {string} prompt - The prompt for generating content.
 * @param {string} notes - The notes for generating content.
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function callOpenAIWrite(beforeText, afterText, selectedText, prompt, notes, writeStyle) {
    let contextMessage = `
----------------------------------
${beforeText}${selectedText}
<Generate content>
${afterText}
----------------------------------

`;

    let noteMessages = "";
    if (notes){
        noteMessages = "The following is additional contextual information, please refer to it when generating content:\n\n";
        for (let note of notes){
            noteMessages += `${note.content}\n\n`;
        }
    }

    if (writeStyle){
        writeStyle = "Pay attention to the " + writeStyle + ".";
    }

    let messages = [
        {
            role: "system", 
            content: `You are an intelligent writing assistant, now working on the following content, \
            Please complete the <Generate content> section, ${writeStyle}\ntaking care to refer to the context \
            and not generating redundant content:\n${contextMessage}${noteMessages}`
        },
        { role: "user", content: prompt},
    ];
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: oaicfg.openaiModel,
        stream: true,
    });
    return completion;
}

/**
 * Call OpenAI to generate summaries based on the provided selected text and prompt.
 * @param {string} selectedText - The selected text.
 * @param {string} prompt - The prompt for generating summaries.
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function callOpenAISummaries(selectedText, prompt) {
    let contextMessage = "\n----------------------------------\n" +
        selectedText +
        "\n----------------------------------\n";
    let messages = [
        {
            role: "system", content: "You're an intelligent writing assistant with the writing skills \
            and insights of a master. Please provide a summary summary of the following:\n" + contextMessage },
        { role: "user", content: prompt},
    ]
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: oaicfg.openaiModel,
        stream: true,
    });
    return completion
}

/**
 * Call OpenAI to generate a Marp slide based on the provided prompt.
 * @param {string} prompt - The prompt for generating the Marp slide.
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function callOpenAIGenMarpSlide(prompt, notes) {
    let noteMessages = "";
    if (notes){
        noteMessages = "---------------------\n\
        The following is additional contextual information, please refer to it when generating content:\n\n";
        for (let note of notes){
            noteMessages += `${note.content}\n\n`;
        }
    }

    let messages = [
        {
            role: "system", content: `You are a marp slide creation assistant that creates a beautifully laid out slide based on a theme proposed by a user. The following is a template for a marp slide, please generate the final slide by combining the template with the theme requirements entered by the user.

---
marp: true
theme: gaia
class: lead
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---


![bg left:40% 80%](https://marp.app/assets/marp.svg)

# Introduction to Marp

---

## What is Marp?

Marp is a powerful Markdown presentation tool that enables you to create clean, simple slides using Markdown syntax.

---

## Key Features

- **Markdown-driven**: Write your slides in Markdown and convert them into HTML, PDF, or PowerPoint presentations.
- **Customizable Themes**: Apply or create custom themes to make your presentation stand out.
- **Cross-platform**: Available as a CLI tool, a desktop app, and a VS Code extension.

---

## Getting Started

1. Install Marp CLI or Marp for VS Code.
2. Write your slides in Markdown.
3. Convert your Markdown to a presentation.

---

## Why Use Marp?

- Easy to use and learn.
- Focus on content, not formatting.
- Portable and easy to share presentations.

---

## Resources

- [Official Website](https://marp.app/)
- [GitHub Repository](https://github.com/marp-team/marp)

---

Thank You!


${noteMessages}
`
        },
        { role: "user", content: prompt},
    ]
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: oaicfg.openaiModel,
        stream: true,
    });
    return completion
}

const teamsgptcfg = getTeamsgptConfig()

module.exports = {
    callOpenAIWrite,
    callOpenAISummaries,
    callOpenAIGenMarpSlide
};