'use strict';

const { Plugin, ItemView, PluginSettingTab, Setting, Notice, MarkdownView, Menu } = require('obsidian');

const DEFAULT_SETTINGS = {
    // 讯飞星火设置
    sparkConfig: {
        enabled: true,
        apiKey: '',
        apiSecret: '',
        appId: '',
        domain: 'generalv3.5'
    },
    // DeepSeek设置
    deepseekConfig: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.deepseek.com'
    },
    // 豆包设置
    doubaoConfig: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'ep-2024'
    },
    // Moonshot设置
    moonshotConfig: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k'
    },
    // 智谱GLM设置
    glmConfig: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4-plus'
    },
    // 通义千问设置
    qwenConfig: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-turbo'
    },
    // 当前选择的模型
    currentModel: 'spark',
    // 问答格式设置
    qaFormat: {
        template: '> [!answer] {{question}}\n> {{answer}}',
        questionPlaceholder: '{{question}}',
        answerPlaceholder: '{{answer}}'
    },
    // 提示词设置
    prompts: [
        {
            name: '总结',
            prompt: '请总结以下内容：\n{{text}}'
        },
        {
            name: '翻译成英文',
            prompt: '请将以下内容翻译成英文：\n{{text}}'
        }
    ]
}

[... rest of the file remains exactly the same ...] 