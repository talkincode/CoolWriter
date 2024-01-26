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
            role: "system", content: "你是一个智能写作助手， 现在正在进行以下文章的撰写, \
        请完成 <Generate content> 部分的内容, 注意要参考上下文，不要生成多余内容:\n" + contextMessage },
        { role: "user", content: prompt},
    ]
    console.log(messages)
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4-1106-preview",
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
            role: "system", content: "你是一个智能写作助手，具有钱钟书一样的文字功底和洞察力， 请对以下内容进行摘要汇总:\n" + contextMessage },
        { role: "user", content: prompt},
    ]
    console.log(messages)
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4-1106-preview",
        stream: true,
    });
    return completion
}


module.exports = {
    callOpenAIWrite,
    callOpenAISummaries
};