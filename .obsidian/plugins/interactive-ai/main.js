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
    // 当前选择的模型
    currentModel: 'spark',
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

// 侧边栏视图类
class InteractiveAIView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.cards = [];
    }

    getViewType() {
        return 'interactive-ai-view';
    }

    getDisplayText() {
        return 'Interactive AI';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.classList.add('interactive-ai-container');
    }

    // 创建新的卡片
    createCard(question, answer, sourceInfo) {
        console.log('创建新卡片 - 问题:', question);
        console.log('创建新卡片 - 回答:', answer);
        console.log('创建新卡片 - 源信息:', sourceInfo);

        const container = this.containerEl.children[1];
        if (!container) {
            console.error('找不到容器元素');
            return;
        }

        const cardEl = container.createDiv('interactive-ai-card');
        console.log('卡片元素已创建');

        // 保存源信息
        cardEl.sourceInfo = sourceInfo;

        // 关闭按钮
        const closeButton = cardEl.createDiv('interactive-ai-close');
        closeButton.setText('×');
        closeButton.addEventListener('click', () => {
            console.log('关闭卡片');
            cardEl.remove();
            const index = this.cards.indexOf(cardEl);
            if (index > -1) {
                this.cards.splice(index, 1);
            }
        });

        // 问题部分（默认折叠）
        const questionEl = cardEl.createDiv('interactive-ai-question');
        questionEl.setText('问题（点击展开）');
        const questionContent = cardEl.createDiv('interactive-ai-question-content');
        questionContent.setText(question);
        questionContent.style.display = 'none';

        questionEl.addEventListener('click', () => {
            console.log('切换问题显示状态');
            questionContent.style.display = questionContent.style.display === 'none' ? 'block' : 'none';
        });

        // 回答部分
        const answerEl = cardEl.createDiv('interactive-ai-answer');
        const answerText = answerEl.createEl('div', {
            text: answer || '正在思考...',
            attr: {
                style: 'user-select: text; cursor: text;'
            }
        });

        // 按钮容器
        const buttonsEl = cardEl.createDiv('interactive-ai-buttons');

        // 替代按钮
        const replaceButton = this.createButton(buttonsEl, '替代', async () => {
            console.log('点击替代按钮');
            if (cardEl.sourceInfo) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file.path === cardEl.sourceInfo.filePath) {
                    // 如果当前打开的文件就是源文件
                    const editor = view.editor;
                    const from = cardEl.sourceInfo.from;
                    const to = cardEl.sourceInfo.to;
                    editor.setSelection(from, to);
                    editor.replaceSelection(answerEl.getText());
                    new Notice('已替换选中文本');
                } else {
                    // 需要先打开源文件
                    const file = this.plugin.app.vault.getAbstractFileByPath(cardEl.sourceInfo.filePath);
                    if (file) {
                        await this.plugin.app.workspace.getLeaf().openFile(file);
                        const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                        if (view) {
                            const editor = view.editor;
                            const from = cardEl.sourceInfo.from;
                            const to = cardEl.sourceInfo.to;
                            editor.setSelection(from, to);
                            editor.replaceSelection(answerEl.getText());
                            new Notice('已替换选中文本');
                        }
                    }
                }
            } else {
                new Notice('无法找到原始文本位置');
            }
        });

        // 追加按钮
        const appendButton = this.createButton(buttonsEl, '追加', async () => {
            console.log('点击追加按钮');
            if (cardEl.sourceInfo) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file.path === cardEl.sourceInfo.filePath) {
                    const editor = view.editor;
                    const to = cardEl.sourceInfo.to;
                    editor.setCursor(to);
                    editor.replaceRange('\n' + answerEl.getText(), to);
                    new Notice('已在原文后追加');
                } else {
                    const file = this.plugin.app.vault.getAbstractFileByPath(cardEl.sourceInfo.filePath);
                    if (file) {
                        await this.plugin.app.workspace.getLeaf().openFile(file);
                        const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                        if (view) {
                            const editor = view.editor;
                            const to = cardEl.sourceInfo.to;
                            editor.setCursor(to);
                            editor.replaceRange('\n' + answerEl.getText(), to);
                            new Notice('已在原文后追加');
                        }
                    }
                }
            } else {
                new Notice('无法找到原始文本位置');
            }
        });

        // 问答按钮
        const qaButton = this.createButton(buttonsEl, '问答', async () => {
            console.log('点击问答按钮');
            if (cardEl.sourceInfo) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file.path === cardEl.sourceInfo.filePath) {
                    const editor = view.editor;
                    const from = cardEl.sourceInfo.from;
                    const to = cardEl.sourceInfo.to;
                    editor.setSelection(from, to);
                    const qaFormat = `> [!answer] ${question}\n> ${answerEl.getText()}`;
                    editor.replaceSelection(qaFormat);
                    new Notice('已插入问答格式');
                } else {
                    const file = this.plugin.app.vault.getAbstractFileByPath(cardEl.sourceInfo.filePath);
                    if (file) {
                        await this.plugin.app.workspace.getLeaf().openFile(file);
                        const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                        if (view) {
                            const editor = view.editor;
                            const from = cardEl.sourceInfo.from;
                            const to = cardEl.sourceInfo.to;
                            editor.setSelection(from, to);
                            const qaFormat = `> [!answer] ${question}\n> ${answerEl.getText()}`;
                            editor.replaceSelection(qaFormat);
                            new Notice('已插入问答格式');
                        }
                    }
                }
            } else {
                new Notice('无法找到原始文本位置');
            }
        });

        // 将新卡片插入到容器的最前面
        if (container.firstChild) {
            console.log('插入到第一个位置');
            container.insertBefore(cardEl, container.firstChild);
        } else {
            console.log('添加到容器末尾');
            container.appendChild(cardEl);
        }

        this.cards.push(cardEl);
        console.log('卡片创建完成');
        return cardEl;
    }

    // 更新卡片内容
    updateCardContent(cardEl, content) {
        const answerEl = cardEl.querySelector('.interactive-ai-answer div');
        if (answerEl) {
            answerEl.setText(content);
        }
    }

    // 创建按钮
    createButton(container, text, callback) {
        const button = container.createEl('button', {
            text: text,
            cls: 'interactive-ai-button'
        });
        button.addEventListener('click', callback);
        return button;
    }
}

class InteractiveAIPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        // 注册视图
        this.registerView(
            'interactive-ai-view',
            (leaf) => (this.view = new InteractiveAIView(leaf, this))
        );

        // 添加插件设置选项卡
        this.addSettingTab(new InteractiveAISettingTab(this.app, this));

        // 添加命令 - 处理选中文本
        this.addCommand({
            id: 'process-selected-text',
            name: '发送选中文本到AI',
            editorCallback: (editor) => {
                const selectedText = editor.getSelection();
                if (selectedText) {
                    this.processSelectedText(selectedText);
                } else {
                    new Notice('请先选择文本');
                }
            },
            hotkeys: [{ modifiers: ["Mod", "Shift"], key: "i" }]
        });

        // 注册编辑器菜单事件
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor) => {
                const selectedText = editor.getSelection();
                if (selectedText) {
                    // 添加主菜单项
                    menu.addItem((item) => {
                        item.setTitle("Interactive AI")
                            .setIcon("bot")
                            .setSubmenu();  // 这会创建一个子菜单
                    });

                    // 获取最后添加的菜单项（即我们的主菜单项）
                    const mainMenuItem = menu.items[menu.items.length - 1];
                    const submenu = mainMenuItem.submenu;

                    // 添加默认选项
                    submenu.addItem((item) => {
                        item.setTitle("直接发送")
                            .setIcon("arrow-right")
                            .onClick(async () => {
                                await this.handlePromptSelection(selectedText, selectedText);
                            });
                    });

                    // 添加分隔线
                    submenu.addSeparator();

                    // 添加自定义提示词选项
                    this.settings.prompts.forEach(prompt => {
                        submenu.addItem((item) => {
                            item.setTitle(prompt.name)
                                .onClick(async () => {
                                    const processedPrompt = prompt.prompt.replace('{{text}}', selectedText);
                                    await this.handlePromptSelection(selectedText, processedPrompt);
                                });
                        });
                    });
                }
            })
        );

        // 自动打开侧边栏
        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });
    }

    async handlePromptSelection(originalText, promptText) {
        // 保存当前编辑器的状态
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const sourceInfo = view ? {
            filePath: view.file.path,
            from: view.editor.getCursor('from'),
            to: view.editor.getCursor('to')
        } : null;

        // 创建卡片并发送请求
        const card = this.view.createCard(originalText, '', sourceInfo);
        await this.callAPI(promptText, (content) => {
            if (card) {
                this.view.updateCardContent(card, content);
            }
        });
    }

    async processSelectedText(text) {
        console.log('开始处理选中文本:', text);

        if (!this.settings.apiSecret) {
            console.error('API密钥未配置');
            new Notice('请先在设置中配置API密钥');
            return;
        }

        try {
            await this.handlePromptSelection(text, text);
        } catch (error) {
            console.error('API调用失败:', error);
            new Notice('调用API失败: ' + error.message);
        }
    }

    async activateView() {
        const workspace = this.app.workspace;
        if (workspace.getLeavesOfType('interactive-ai-view').length === 0) {
            await workspace.getRightLeaf(false).setViewState({
                type: 'interactive-ai-view',
                active: true,
            });
        }
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType('interactive-ai-view');
    }

    // 替换选中的文本
    async replaceSelectedText(text) {
        const editor = this.getActiveEditor();
        if (editor && editor.somethingSelected()) {
            editor.replaceSelection(text);
        }
    }

    // 在选中文本后追加
    async appendToSelectedText(text) {
        const editor = this.getActiveEditor();
        if (editor && editor.somethingSelected()) {
            const selection = editor.getSelection();
            const cursor = editor.getCursor('to');
            editor.replaceSelection(selection + '\n' + text);
        }
    }

    // 插入问答格式
    async insertAsQA(question, answer) {
        const editor = this.getActiveEditor();
        if (editor && editor.somethingSelected()) {
            const qaFormat = `> [!question] 问题\n> ${question}\n\n> [!answer] 回答\n> ${answer}`;
            editor.replaceSelection(qaFormat);
        }
    }

    // 获取当前活动编辑器
    getActiveEditor() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view ? view.editor : null;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async callAPI(text, onUpdate) {
        const model = this.settings.currentModel;
        
        if (model === 'spark' && this.settings.sparkConfig.enabled) {
            return this.callSparkAPI(text, onUpdate);
        } else if (model === 'deepseek' && this.settings.deepseekConfig.enabled) {
            return this.callDeepSeekAPI(text, onUpdate);
        } else {
            throw new Error('请先在设置中选择并配置要使用的模型');
        }
    }

    async callDeepSeekAPI(text, onUpdate) {
        if (!this.settings.deepseekConfig.apiKey) {
            throw new Error('请先配置DeepSeek API Key');
        }

        const url = `${this.settings.deepseekConfig.baseUrl}/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.settings.deepseekConfig.apiKey}`
        };

        const data = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            stream: true
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let content = '';

            while (true) {
                const {value, done} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (line.includes('[DONE]')) continue;

                    try {
                        const jsonStr = line.replace(/^data: /, '');
                        const response = JSON.parse(jsonStr);
                        
                        if (response.choices && response.choices[0].delta.content) {
                            content += response.choices[0].delta.content;
                            if (onUpdate) {
                                onUpdate(content);
                            }
                        }
                    } catch (e) {
                        console.error('解析响应失败:', e);
                    }
                }
            }

            return {
                choices: [
                    {
                        message: {
                            content: content
                        }
                    }
                ]
            };
        } catch (error) {
            console.error('DeepSeek API调用失败:', error);
            throw error;
        }
    }

    async callSparkAPI(text, onUpdate) {
        if (!this.settings.sparkConfig.apiKey || !this.settings.sparkConfig.apiSecret || !this.settings.sparkConfig.appId) {
            throw new Error('请先完成API配置');
        }

        // 根据模型版本获取对应的WebSocket URL
        const getWebsocketUrl = () => {
            const domain = this.settings.sparkConfig.domain;
            switch (domain) {
                case '4.0Ultra':
                    return 'wss://spark-api.xf-yun.com/v4.0/chat';
                case 'max-32k':
                    return 'wss://spark-api.xf-yun.com/chat/max-32k';
                case 'generalv3.5':
                    return 'wss://spark-api.xf-yun.com/v3.5/chat';
                case 'pro-128k':
                    return 'wss://spark-api.xf-yun.com/chat/pro-128k';
                case 'generalv3':
                    return 'wss://spark-api.xf-yun.com/v3.1/chat';
                case 'lite':
                    return 'wss://spark-api.xf-yun.com/v1.1/chat';
                default:
                    throw new Error('未知的模型版本');
            }
        };

        return new Promise((resolve, reject) => {
            // 生成鉴权URL
            const host = 'spark-api.xf-yun.com';
            const date = new Date().toUTCString();
            const path = '/v3.5/chat';

            console.log('正在生成鉴权信息...');
            console.log('Host:', host);
            console.log('Date:', date);
            console.log('Path:', path);

            // 生成签名字符串
            const tmp = [
                `host: ${host}`,
                `date: ${date}`,
                `GET ${path} HTTP/1.1`
            ].join('\n');

            console.log('签名字符串:', tmp);

            // 使用HMAC-SHA256算法结合APISecret对tmp签名
            const encoder = new TextEncoder();
            const keyData = encoder.encode(this.settings.apiSecret);
            const dataData = encoder.encode(tmp);
            
            crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            ).then(cryptoKey => {
                console.log('密钥已生成');
                return crypto.subtle.sign(
                    'HMAC',
                    cryptoKey,
                    dataData
                );
            }).then(signature => {
                const signatureBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(signature)));
                console.log('签名已生成:', signatureBase64);

                // 组装authorization_origin
                const authorization_origin = `api_key="${this.settings.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
                console.log('Authorization Origin:', authorization_origin);
                
                // 生成最终的authorization
                const authorization = btoa(authorization_origin);
                console.log('最终Authorization:', authorization);

                // 构建WebSocket URL
                const params = new URLSearchParams({
                    authorization: authorization,
                    date: date,
                    host: host
                });

                const wsUrl = `wss://${host}${path}?${params.toString()}`;
                console.log('WebSocket URL:', wsUrl);

                const ws = new WebSocket(wsUrl);
                let responseText = '';

                ws.onopen = () => {
                    console.log('WebSocket连接已建立，准备发送数据...');
                    const data = {
                        header: {
                            app_id: this.settings.appId,
                            uid: "default"
                        },
                        parameter: {
                            chat: {
                                domain: this.settings.domain,
                                temperature: 0.5,
                                max_tokens: 4096
                            }
                        },
                        payload: {
                            message: {
                                text: [
                                    {
                                        role: "user",
                                        content: text
                                    }
                                ]
                            }
                        }
                    };

                    console.log('发送数据:', JSON.stringify(data, null, 2));
                    ws.send(JSON.stringify(data));
                };

                ws.onmessage = (event) => {
                    console.log('收到消息:', event.data);
                    try {
                        // 检查是否是[DONE]消息
                        if (event.data === 'data:[DONE]') {
                            console.log('收到结束标记，关闭连接');
                            ws.close();
                            resolve({
                                choices: [
                                    {
                                        message: {
                                            content: responseText
                                        }
                                    }
                                ]
                            });
                            return;
                        }

                        // 解析data:前缀
                        const jsonStr = event.data.replace(/^data: /, '');
                        const response = JSON.parse(jsonStr);
                        console.log('解析后的响应:', response);

                        // 检查是否有错误
                        if (response.header && response.header.code !== 0) {
                            console.error('API返回错误:', response.header);
                            ws.close();
                            reject(new Error(response.header.message || '未知错误'));
                            return;
                        }

                        // 累积响应文本
                        if (response.payload && response.payload.choices && response.payload.choices.text) {
                            const content = response.payload.choices.text[0].content;
                            console.log('收到内容:', content);
                            responseText += content;
                            // 调用更新回调
                            if (onUpdate) {
                                onUpdate(responseText);
                            }
                        }
                    } catch (error) {
                        console.error('解析响应失败:', error, '原始数据:', event.data);
                    }
                };

                ws.onerror = (error) => {
                    console.error('WebSocket错误:', error);
                    reject(new Error('WebSocket连接错误'));
                };

                ws.onclose = (event) => {
                    console.log('WebSocket连接已关闭', event.code, event.reason);
                    if (!responseText) {
                        reject(new Error('连接关闭但未收到响应'));
                    }
                };

                // 设置超时
                setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        console.log('连接超时，强制关闭');
                        ws.close();
                        reject(new Error('连接超时'));
                    }
                }, 30000); // 30秒超时
            }).catch(error => {
                console.error('处理过程中出错:', error);
                reject(error);
            });
        });
    }
}

class InteractiveAISettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Interactive AI 设置'});

        // 模型选择
        new Setting(containerEl)
            .setName('选择使用的模型')
            .setDesc('选择要使用的AI模型')
            .addDropdown(dropdown => dropdown
                .addOption('spark', '讯飞星火')
                .addOption('deepseek', 'DeepSeek')
                .setValue(this.plugin.settings.currentModel)
                .onChange(async (value) => {
                    this.plugin.settings.currentModel = value;
                    await this.plugin.saveSettings();
                    // 刷新设置页面以显示/隐藏相应的设置项
                    this.display();
                }));

        // 讯飞星火设置
        if (this.plugin.settings.currentModel === 'spark') {
            containerEl.createEl('h3', {text: '讯飞星火设置'});
            
            new Setting(containerEl)
                .setName('启用讯飞星火')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.sparkConfig.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.sparkConfig.enabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.sparkConfig.enabled) {
                new Setting(containerEl)
                    .setName('App ID')
                    .setDesc('请输入您的讯飞星火 App ID')
                    .addText(text => text
                        .setPlaceholder('输入App ID')
                        .setValue(this.plugin.settings.sparkConfig.appId)
                        .onChange(async (value) => {
                            this.plugin.settings.sparkConfig.appId = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Key')
                    .setDesc('请输入您的讯飞星火 API Key')
                    .addText(text => text
                        .setPlaceholder('输入API Key')
                        .setValue(this.plugin.settings.sparkConfig.apiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.sparkConfig.apiKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Secret')
                    .setDesc('请输入您的讯飞星火 API Secret')
                    .addText(text => text
                        .setPlaceholder('输入API Secret')
                        .setValue(this.plugin.settings.sparkConfig.apiSecret)
                        .onChange(async (value) => {
                            this.plugin.settings.sparkConfig.apiSecret = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('模型版本')
                    .setDesc('选择讯飞星火模型版本')
                    .addDropdown(dropdown => dropdown
                        .addOption('4.0Ultra', 'Spark 4.0 Ultra')
                        .addOption('max-32k', 'Spark Max-32K')
                        .addOption('generalv3.5', 'Spark Max')
                        .addOption('pro-128k', 'Spark Pro-128K')
                        .addOption('generalv3', 'Spark Pro')
                        .addOption('lite', 'Spark Lite')
                        .setValue(this.plugin.settings.sparkConfig.domain)
                        .onChange(async (value) => {
                            this.plugin.settings.sparkConfig.domain = value;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        // DeepSeek设置
        if (this.plugin.settings.currentModel === 'deepseek') {
            containerEl.createEl('h3', {text: 'DeepSeek设置'});
            
            new Setting(containerEl)
                .setName('启用DeepSeek')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.deepseekConfig.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.deepseekConfig.enabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.deepseekConfig.enabled) {
                new Setting(containerEl)
                    .setName('API Key')
                    .setDesc('请输入您的DeepSeek API Key')
                    .addText(text => text
                        .setPlaceholder('输入API Key')
                        .setValue(this.plugin.settings.deepseekConfig.apiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.deepseekConfig.apiKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Base URL')
                    .setDesc('DeepSeek API的基础URL')
                    .addText(text => text
                        .setPlaceholder('https://api.deepseek.com')
                        .setValue(this.plugin.settings.deepseekConfig.baseUrl)
                        .onChange(async (value) => {
                            this.plugin.settings.deepseekConfig.baseUrl = value;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        // 提示词设置
        containerEl.createEl('h3', {text: '自定义提示词'});
        
        // 提示词列表
        const promptsContainer = containerEl.createDiv('prompt-list');
        this.plugin.settings.prompts.forEach((prompt, index) => {
            const promptContainer = promptsContainer.createDiv('prompt-item');
            
            new Setting(promptContainer)
                .setName('提示词名称')
                .addText(text => text
                    .setValue(prompt.name)
                    .onChange(async (value) => {
                        this.plugin.settings.prompts[index].name = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(promptContainer)
                .setName('提示词内容')
                .setDesc('使用 {{text}} 表示选中的文字')
                .addTextArea(text => text
                    .setValue(prompt.prompt)
                    .onChange(async (value) => {
                        this.plugin.settings.prompts[index].prompt = value;
                        await this.plugin.saveSettings();
                    }));

            // 删除按钮
            new Setting(promptContainer)
                .addButton(button => button
                    .setButtonText('删除')
                    .onClick(async () => {
                        this.plugin.settings.prompts.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });

        // 添加新提示词按钮
        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('+ 添加提示词')
                .onClick(async () => {
                    this.plugin.settings.prompts.push({
                        name: '新提示词',
                        prompt: '{{text}}'
                    });
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }
}

module.exports = InteractiveAIPlugin; 