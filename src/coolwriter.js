const OpenAI = require('openai');
const vscode = require('vscode');

/**
 * get openai config
 * @returns 
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

const oaicfg = getOpenaiConfig()
const openai = new OpenAI({apiKey: oaicfg.openaiApikey});

async function callOpenAIWrite(beforeText, afterText, selectedText, prompt) {
    let contextMessage = "\n----------------------------------\n" +
        beforeText +
        selectedText +
        '\n<Generate content>\n' +
        afterText +
        "\n----------------------------------\n";
    let messages = [
        {
            role: "system", content: "You are an intelligent writing assistant, now working on the following article, \
            Please complete the <Generate content> section, taking care to refer to the context \
            and not generating redundant content:\n" + contextMessage },
        { role: "user", content: prompt},
    ]
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: oaicfg.openaiModel,
        stream: true,
    });
    return completion
}


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

async function callOpenAIGenMarpSlide(prompt) {
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


module.exports = {
    callOpenAIWrite,
    callOpenAISummaries,
    callOpenAIGenMarpSlide
};