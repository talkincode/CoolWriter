const OpenAI = require('openai');

const openai = new OpenAI();

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
        model: "gpt-4-turbo-preview",
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
        model: "gpt-4-turbo-preview",
        stream: true,
    });
    return completion
}


module.exports = {
    callOpenAIWrite,
    callOpenAISummaries
};