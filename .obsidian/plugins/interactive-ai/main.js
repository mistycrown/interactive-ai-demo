'use strict';

const { Plugin, ItemView, PluginSettingTab, Setting, Notice, MarkdownView } = require('obsidian');

const DEFAULT_SETTINGS = {
    apiKey: '',
    apiSecret: '',
    appId: '',
    domain: 'generalv3.5'
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
    createCard(question, answer) {
        console.log('创建新卡片 - 问题:', question);
        console.log('创建新卡片 - 回答:', answer);

        const container = this.containerEl.children[1];
        if (!container) {
            console.error('找不到容器元素');
            return;
        }

        const cardEl = container.createDiv('interactive-ai-card');
        console.log('卡片元素已创建');

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
        answerEl.setText(answer || '正在思考...');

        // 按钮容器
        const buttonsEl = cardEl.createDiv('interactive-ai-buttons');

        // 替代按钮
        const replaceButton = this.createButton(buttonsEl, '替代', async () => {
            console.log('点击替代按钮');
            const editor = this.plugin.getActiveEditor();
            if (editor && editor.somethingSelected()) {
                await this.plugin.replaceSelectedText(answerEl.getText());
                new Notice('已替换选中文本');
            } else {
                new Notice('请先选择要替换的文本');
            }
        });

        // 追加按钮
        const appendButton = this.createButton(buttonsEl, '追加', async () => {
            console.log('点击追加按钮');
            const editor = this.plugin.getActiveEditor();
            if (editor && editor.somethingSelected()) {
                await this.plugin.appendToSelectedText(answerEl.getText());
                new Notice('已在选中文本后追加');
            } else {
                new Notice('请先选择要追加的位置');
            }
        });

        // 问答按钮
        const qaButton = this.createButton(buttonsEl, '问答', async () => {
            console.log('点击问答按钮');
            const editor = this.plugin.getActiveEditor();
            if (editor && editor.somethingSelected()) {
                await this.plugin.insertAsQA(question, answerEl.getText());
                new Notice('已插入问答格式');
            } else {
                new Notice('请先选择要插入的位置');
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
        const answerEl = cardEl.querySelector('.interactive-ai-answer');
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

        // 自动打开侧边栏
        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });
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

    async processSelectedText(text) {
        console.log('开始处理选中文本:', text);

        if (!this.settings.apiSecret) {
            console.error('API密钥未配置');
            new Notice('请先在设置中配置API密钥');
            return;
        }

        try {
            console.log('调用API...');
            // 先创建一个空的卡片
            const card = this.view.createCard(text, '');
            
            const response = await this.callSparkAPI(text, (content) => {
                // 更新卡片内容的回调函数
                if (card) {
                    this.view.updateCardContent(card, content);
                }
            });

            console.log('API响应完成');
        } catch (error) {
            console.error('API调用失败:', error);
            new Notice('调用API失败: ' + error.message);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async callSparkAPI(text, onUpdate) {
        if (!this.settings.apiKey || !this.settings.apiSecret || !this.settings.appId) {
            throw new Error('请先完成API配置');
        }

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

        new Setting(containerEl)
            .setName('讯飞星火 App ID')
            .setDesc('请输入您的讯飞星火 App ID')
            .addText(text => text
                .setPlaceholder('输入App ID')
                .setValue(this.plugin.settings.appId)
                .onChange(async (value) => {
                    this.plugin.settings.appId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('讯飞星火 API Key')
            .setDesc('请输入您的讯飞星火 API Key')
            .addText(text => text
                .setPlaceholder('输入API Key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('讯飞星火 API Secret')
            .setDesc('请输入您的讯飞星火 API Secret')
            .addText(text => text
                .setPlaceholder('输入API Secret')
                .setValue(this.plugin.settings.apiSecret)
                .onChange(async (value) => {
                    this.plugin.settings.apiSecret = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('模型版本')
            .setDesc('选择讯飞星火模型版本')
            .addDropdown(dropdown => dropdown
                .addOption('generalv3.5', 'Spark Max V3.5')
                .addOption('generalv2', 'Spark V2')
                .addOption('generalv1.5', 'Spark V1.5')
                .setValue(this.plugin.settings.domain)
                .onChange(async (value) => {
                    this.plugin.settings.domain = value;
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = InteractiveAIPlugin; 