'use strict';

const { Plugin, ItemView, PluginSettingTab, Setting, Notice, MarkdownView, Menu, MarkdownRenderer } = require('obsidian');

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
        accessKey: '',  // VOLC_ACCESSKEY
        secretKey: '',  // VOLC_SECRETKEY
        baseUrl: 'https://ark-cn-beijing.bytedance.net/api/v3',
        model: '',  // endpoint ID
        endpointId: '',  // endpoint ID
        region: 'cn-beijing'  // 指定区域
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

        // 创建导航栏
        const navBar = container.createDiv('interactive-ai-nav');
        
        // 模型选择器
        const modelSelector = navBar.createEl('select', {
            cls: 'interactive-ai-model-select'
        });

        // 添加已启用的模型选项
        const configs = {
            'spark': { name: '讯飞星火', config: this.plugin.settings.sparkConfig },
            'deepseek': { name: 'DeepSeek', config: this.plugin.settings.deepseekConfig },
            'moonshot': { name: 'Moonshot', config: this.plugin.settings.moonshotConfig },
            'glm': { name: '智谱GLM', config: this.plugin.settings.glmConfig },
            'qwen': { name: '通义千问', config: this.plugin.settings.qwenConfig },
            'doubao': { name: '豆包', config: this.plugin.settings.doubaoConfig }
        };

        Object.entries(configs).forEach(([key, value]) => {
            if (value.config.enabled) {
                const option = modelSelector.createEl('option', {
                    text: value.name,
                    value: key
                });
                if (key === this.plugin.settings.currentModel) {
                    option.selected = true;
                }
            }
        });

        modelSelector.addEventListener('change', async (e) => {
            this.plugin.settings.currentModel = e.target.value;
            await this.plugin.saveSettings();
        });

        // 创建对话内容区域
        this.contentArea = container.createDiv('interactive-ai-content');

        // 创建输入区域容器
        const inputContainer = container.createDiv('interactive-ai-input-container');

        // 创建引用区域
        const referenceArea = inputContainer.createDiv('interactive-ai-reference');
        referenceArea.style.display = 'none'; // 默认隐藏

        // 引用图标
        const referenceIcon = referenceArea.createDiv('interactive-ai-reference-icon');
        const quoteIcon = this.createSvgIcon('quote');
        referenceIcon.appendChild(quoteIcon);

        // 引用文本
        const referenceText = referenceArea.createDiv('interactive-ai-reference-text');

        // 清除引用按钮
        const clearButton = referenceArea.createDiv('interactive-ai-reference-clear');
        const closeIcon = this.createSvgIcon('x');
        clearButton.appendChild(closeIcon);
        clearButton.addEventListener('click', () => {
            referenceArea.style.display = 'none';
            referenceText.setText('');
            delete inputContainer.dataset.reference;
        });

        // 创建输入框包装器
        const inputWrapper = inputContainer.createDiv('interactive-ai-input-wrapper');

        // 创建输入框
        const textarea = inputWrapper.createEl('textarea', {
            cls: 'interactive-ai-input',
            attr: {
                placeholder: '输入问题，按Enter发送（Shift+Enter换行）'
            }
        });

        // 添加发送按钮
        const sendButton = inputWrapper.createEl('button', {
            cls: 'interactive-ai-send-button',
            text: '发送'
        });

        // 处理发送逻辑
        const handleSend = async () => {
            const text = textarea.value.trim();
            if (text) {
                let finalText = text;
                // 如果有引用文本，将其添加到问题中
                if (inputContainer.dataset.reference) {
                    finalText = `参考以下内容：\n${inputContainer.dataset.reference}\n\n${text}`;
                }
                
                const card = this.createCard(text, '', null);
                await this.plugin.callAPI(finalText, (content) => {
                    if (card) {
                        this.updateCardContent(card, content);
                    }
                });
                textarea.value = '';
                // 清除引用
                referenceArea.style.display = 'none';
                referenceText.setText('');
                delete inputContainer.dataset.reference;
            }
        };

        // 发送按钮点击事件
        sendButton.addEventListener('click', handleSend);

        // 处理输入框的按键事件
        textarea.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await handleSend();
            }
        });
    }

    // 创建SVG图标的辅助方法
    createSvgIcon(type) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        let path;
        switch (type) {
            case 'quote':
                path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z');
                svg.appendChild(path);
                const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path2.setAttribute('d', 'M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z');
                svg.appendChild(path2);
                break;
            case 'x':
                const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line1.setAttribute('x1', '18');
                line1.setAttribute('y1', '6');
                line1.setAttribute('x2', '6');
                line1.setAttribute('y2', '18');
                const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line2.setAttribute('x1', '6');
                line2.setAttribute('y1', '6');
                line2.setAttribute('x2', '18');
                line2.setAttribute('y2', '18');
                svg.appendChild(line1);
                svg.appendChild(line2);
                break;
        }
        return svg;
    }

    // 设置引用文本的方法
    setReference(text) {
        const inputContainer = this.containerEl.querySelector('.interactive-ai-input-container');
        const referenceArea = inputContainer.querySelector('.interactive-ai-reference');
        const referenceText = referenceArea.querySelector('.interactive-ai-reference-text');
        
        referenceArea.style.display = 'flex';
        referenceText.setText(text.length > 100 ? text.slice(0, 100) + '...' : text);
        inputContainer.dataset.reference = text;
    }

    // 更新卡片内容
    updateCardContent(cardEl, content) {
        const answerEl = cardEl.querySelector('.interactive-ai-answer div');
        if (answerEl) {
            // 保存原始文本
            answerEl.setAttribute('data-original-text', content);
            // 清空现有内容
            answerEl.empty();
            // 渲染Markdown
            MarkdownRenderer.renderMarkdown(content, answerEl, '', this.plugin);
        }
    }

    // 创建新的卡片
    createCard(question, answer, sourceInfo) {
        const cardEl = this.contentArea.createDiv('interactive-ai-card');
        
        // 保存源信息和原始问题
        cardEl.sourceInfo = sourceInfo;
        cardEl.originalQuestion = question;

        // 创建卡片头部
        const headerEl = cardEl.createDiv('interactive-ai-card-header');
        
        // 左侧时间戳和问题
        const headerLeft = headerEl.createDiv('interactive-ai-header-left');
        
        // 时间戳
        const timestamp = headerLeft.createDiv('interactive-ai-timestamp');
        const now = new Date();
        timestamp.setText(now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }));

        // 问题部分
        const questionEl = headerLeft.createDiv('interactive-ai-question');
        const questionContent = questionEl.createDiv('interactive-ai-question-content');
        const shortQuestion = question.length > 20 ? question.slice(0, 20) + '...' : question;
        questionContent.setText(shortQuestion);
        questionContent.setAttribute('data-original-text', question);

        // 关闭按钮
        const closeButton = headerEl.createDiv('interactive-ai-close');
        closeButton.setText('×');
        closeButton.addEventListener('click', () => {
            cardEl.remove();
            const index = this.cards.indexOf(cardEl);
            if (index > -1) {
                this.cards.splice(index, 1);
            }
        });

        // 回答部分
        const answerEl = cardEl.createDiv('interactive-ai-answer');
        const answerContent = answerEl.createDiv({
            cls: 'markdown-rendered',
            attr: {
                style: 'user-select: text; cursor: text;'
            }
        });
        
        // 渲染初始回答
        if (answer) {
            answerContent.setAttribute('data-original-text', answer);
            MarkdownRenderer.renderMarkdown(answer, answerContent, '', this.plugin);
        } else {
            answerContent.setText('正在思考...');
        }

        // 按钮容器
        const buttonsEl = cardEl.createDiv('interactive-ai-buttons');

        // 重试按钮
        const retryButton = this.createButton(buttonsEl, '重试', async () => {
            // 清空现有回答
            answerContent.empty();
            answerContent.setText('正在思考...');
            
            // 重新发送请求
            await this.plugin.callAPI(cardEl.originalQuestion, (content) => {
                this.updateCardContent(cardEl, content);
            });
        });

        // 替换按钮
        const replaceButton = this.createButton(buttonsEl, '替换', async () => {
            if (cardEl.sourceInfo) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file.path === cardEl.sourceInfo.filePath) {
                    const editor = view.editor;
                    const from = cardEl.sourceInfo.from;
                    const to = cardEl.sourceInfo.to;
                    editor.setSelection(from, to);
                    const originalText = answerContent.getAttribute('data-original-text');
                    editor.replaceSelection(originalText);
                            new Notice('已替换选中文本');
                        }
            }
        });

        // 插入按钮
        const appendButton = this.createButton(buttonsEl, '插入', async () => {
            if (cardEl.sourceInfo) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file.path === cardEl.sourceInfo.filePath) {
                    const editor = view.editor;
                    const to = cardEl.sourceInfo.to;
                    editor.setCursor(to);
                    const originalText = answerContent.getAttribute('data-original-text');
                    editor.replaceRange('\n' + originalText, to);
                    new Notice('已在原文后插入');
                }
            }
        });

        // 问答按钮
        const qaButton = this.createButton(buttonsEl, '问答', async () => {
            if (cardEl.sourceInfo) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file.path === cardEl.sourceInfo.filePath) {
                    const editor = view.editor;
                    const from = cardEl.sourceInfo.from;
                    const to = cardEl.sourceInfo.to;
                    editor.setSelection(from, to);
                    const originalText = answerContent.getAttribute('data-original-text');
                    const format = this.plugin.settings.qaFormat.template
                        .replace(this.plugin.settings.qaFormat.questionPlaceholder, question)
                        .replace(this.plugin.settings.qaFormat.answerPlaceholder, originalText);
                            editor.replaceSelection(format);
                            new Notice('已插入问答格式');
                        }
            }
        });

        // 将新卡片插入到内容区域的最前面
        if (this.contentArea.firstChild) {
            this.contentArea.insertBefore(cardEl, this.contentArea.firstChild);
        } else {
            this.contentArea.appendChild(cardEl);
        }

        this.cards = this.cards || [];
        this.cards.push(cardEl);
        return cardEl;
    }

    // 创建按钮
    createButton(container, text, callback) {
        const button = container.createEl('button', {
            cls: 'interactive-ai-button',
            attr: {
                'aria-label': text
            }
        });

        // 创建SVG图标
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        // 根据按钮类型添加不同的图标路径
        switch (text) {
            case '重试':
                // 重试图标 (refresh)
                const refreshPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                refreshPath.setAttribute('d', 'M23 4v6h-6M1 20v-6h6');
                const refreshPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                refreshPath2.setAttribute('d', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15');
                svg.appendChild(refreshPath);
                svg.appendChild(refreshPath2);
                break;
            case '替换':
                // 替换图标 (replace)
                const replacePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                replacePath.setAttribute('d', 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
                svg.appendChild(replacePath);
                break;
            case '插入':
                // 插入图标 (plus-circle)
                const insertCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                insertCircle.setAttribute('cx', '12');
                insertCircle.setAttribute('cy', '12');
                insertCircle.setAttribute('r', '10');
                const insertPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                insertPath.setAttribute('d', 'M12 8v8M8 12h8');
                svg.appendChild(insertCircle);
                svg.appendChild(insertPath);
                break;
            case '问答':
                // 问答图标 (message-circle)
                const qaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                qaPath.setAttribute('d', 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
                svg.appendChild(qaPath);
                break;
        }

        button.appendChild(svg);
        button.addEventListener('click', callback);
        return button;
    }

    // 辅助函数：将HTML转换为Markdown
    htmlToMarkdown(html) {
        // 移除所有的 class 属性
        html = html.replace(/\sclass="[^"]*"/g, '');
        
        // 处理代码块
        html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, content) => {
            // 移除HTML实体编码
            content = content
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/&#x2F;/g, '/')
                .replace(/&nbsp;/g, ' ');
            return '```\n' + content + '\n```';
        });

        // 处理其他Markdown元素
        return html
            // 段落
            .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n')
            // 标题
            .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1\n')
            .replace(/<h5[^>]*>(.*?)<\/h5>/g, '##### $1\n')
            .replace(/<h6[^>]*>(.*?)<\/h6>/g, '###### $1\n')
            // 列表
            .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, '$1\n')
            .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, '$1\n')
            .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n')
            // 引用
            .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, '> $1\n')
            // 强调
            .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**')
            .replace(/<b[^>]*>([\s\S]*?)<\/b>/g, '**$1**')
            .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*')
            .replace(/<i[^>]*>([\s\S]*?)<\/i>/g, '*$1*')
            // 行内代码
            .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, '`$1`')
            // 链接
            .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
            // 图片
            .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
            // 分隔线
            .replace(/<hr[^>]*>/g, '---\n')
            // 换行
            .replace(/<br[^>]*>/g, '\n')
            // 移除剩余的HTML标签
            .replace(/<[^>]+>/g, '')
            // 处理HTML实体
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&nbsp;/g, ' ')
            // 清理多余的空行
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
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

        // 添加命令 - 打开AI助手侧边栏
        this.addCommand({
            id: 'open-interactive-ai',
            name: '打开AI助手侧边栏',
            callback: () => {
                this.activateView();
            }
        });

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
            hotkeys: [{ modifiers: ["Mod", "Alt"], key: "i" }]
        });

        // 添加命令 - 引用选中文本
        this.addCommand({
            id: 'quote-to-interactive-ai',
            name: '引用至Interactive AI',
            editorCallback: (editor) => {
                const selectedText = editor.getSelection();
                if (selectedText) {
                    this.activateView().then(() => {
                        if (this.view) {
                            this.view.setReference(selectedText);
                        }
                    });
                } else {
                    new Notice('请先选择文本');
                }
            }
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
                                await this.activateView();  // 先打开侧边栏
                                await this.handlePromptSelection(selectedText, selectedText);
                            });
                    });

                    // 添加引用选项
                    submenu.addItem((item) => {
                        item.setTitle("引用至Interactive AI")
                            .setIcon("quote-glyph")
                            .onClick(async () => {
                                await this.activateView();
                                if (this.view) {
                                    this.view.setReference(selectedText);
                                }
                            });
                    });

                    // 添加分隔线
                    submenu.addSeparator();

                    // 添加自定义提示词选项
                    this.settings.prompts.forEach(prompt => {
                        submenu.addItem((item) => {
                            item.setTitle(prompt.name)
                                .onClick(async () => {
                                    await this.activateView();  // 先打开侧边栏
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
        } else if (model === 'moonshot' && this.settings.moonshotConfig.enabled) {
            return this.callMoonshotAPI(text, onUpdate);
        } else if (model === 'glm' && this.settings.glmConfig.enabled) {
            return this.callGLMAPI(text, onUpdate);
        } else if (model === 'qwen' && this.settings.qwenConfig.enabled) {
            return this.callQwenAPI(text, onUpdate);
        } else if (model === 'doubao' && this.settings.doubaoConfig.enabled) {
            return this.callDoubaoAPI(text, onUpdate);
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

    async callMoonshotAPI(text, onUpdate) {
        if (!this.settings.moonshotConfig.apiKey) {
            throw new Error('请先配置Moonshot API Key');
        }

        const url = `${this.settings.moonshotConfig.baseUrl}/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.settings.moonshotConfig.apiKey}`
        };

        const data = {
            model: this.settings.moonshotConfig.model,
            messages: [
                {
                    role: 'system',
                    content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
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
            console.error('Moonshot API调用失败:', error);
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

    async callGLMAPI(text, onUpdate) {
        if (!this.settings.glmConfig.apiKey) {
            throw new Error('请先配置智谱GLM API Key');
        }

        const url = `${this.settings.glmConfig.baseUrl}/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.settings.glmConfig.apiKey}`
        };

        const data = {
            model: this.settings.glmConfig.model,
            messages: [
                {
                    role: 'system',
                    content: '你是一个乐于回答各种问题的小助手，你的任务是提供专业、准确、有洞察力的建议。'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
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
                        
                        if (response.choices && response.choices[0].delta && response.choices[0].delta.content) {
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
            console.error('智谱GLM API调用失败:', error);
            throw error;
        }
    }

    async callQwenAPI(text, onUpdate) {
        if (!this.settings.qwenConfig.apiKey) {
            throw new Error('请先配置通义千问 API Key');
        }

        const url = `${this.settings.qwenConfig.baseUrl}/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.settings.qwenConfig.apiKey}`
        };

        const data = {
            model: this.settings.qwenConfig.model,
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
            temperature: 0.3,
            stream: true,
            stream_options: {
                "include_usage": true
            }
        };

        try {
            console.log('发送请求到通义千问API:', url);
            console.log('请求头:', headers);
            console.log('请求数据:', data);

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('通义千问API错误响应:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
                        console.log('通义千问API返回数据:', response);
                        
                        if (response.choices && response.choices[0]) {
                            if (response.choices[0].delta && response.choices[0].delta.content) {
                                content += response.choices[0].delta.content;
                            } else if (response.choices[0].message && response.choices[0].message.content) {
                                content += response.choices[0].message.content;
                            }
                            
                            if (onUpdate) {
                                onUpdate(content);
                            }
                        }

                        // 如果有usage信息，记录到日志
                        if (response.usage) {
                            console.log('Token使用情况:', response.usage);
                        }
                    } catch (e) {
                        console.error('解析响应失败:', e, '原始数据:', line);
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
            console.error('通义千问API调用失败:', error);
            throw error;
        }
    }

    // 添加代理处理函数
    async handleProxyRequest(apiUrl, options) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        };

        // 创建新的请求对象
        const request = new Request(apiUrl, {
            ...options,
            headers: {
                ...options.headers,
                'Origin': new URL(apiUrl).origin
            }
        });

        // 发送请求
        const response = await fetch(request);
        
        // 创建新的响应对象
        return new Response(response.body, {
            ...response,
            headers: {
                ...response.headers,
                ...corsHeaders
            }
        });
    }

    async callDoubaoAPI(text, onUpdate) {
        if (!this.settings.doubaoConfig.secretKey) {
            throw new Error('请先配置豆包 Secret Key');
        }

        const https = require('https');
        const fullUrl = `${this.settings.doubaoConfig.baseUrl}/chat/completions`;
        const url = new URL(fullUrl);
        
        const data = {
            model: this.settings.doubaoConfig.endpointId,
            messages: [
                {
                    role: 'system',
                    content: '你是豆包，是由字节跳动开发的 AI 人工智能助手'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            stream: true
        };

        // 确保region有值
        const region = this.settings.doubaoConfig.region || 'cn-beijing';

        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.doubaoConfig.secretKey}`,
                'X-Region': region
            }
        };

        console.log('完整URL:', fullUrl);
        console.log('hostname:', options.hostname);
        console.log('path:', options.path);
        console.log('Region:', region);
        console.log('EndpointId:', this.settings.doubaoConfig.endpointId);

        return new Promise((resolve, reject) => {
            try {
                console.log('发送请求到豆包API:', url.toString());
                console.log('请求头:', options.headers);
                console.log('请求数据:', data);

                const req = https.request(options, (res) => {
                    if (res.statusCode !== 200) {
                        let errorData = '';
                        res.on('data', (chunk) => {
                            errorData += chunk;
                        });
                        res.on('end', () => {
                            console.error('豆包API错误响应:', {
                                statusCode: res.statusCode,
                                headers: res.headers,
                                body: errorData
                            });
                            reject(new Error(`HTTP error! status: ${res.statusCode}, body: ${errorData}`));
                        });
                        return;
                    }

                    let content = '';
                    res.setEncoding('utf8');

                    res.on('data', (chunk) => {
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.trim() === '') continue;
                            if (line.includes('[DONE]')) continue;

                            try {
                                const jsonStr = line.replace(/^data: /, '');
                                const response = JSON.parse(jsonStr);
                                console.log('豆包API返回数据:', response);
                                
                                if (response.choices && response.choices[0]) {
                                    if (response.choices[0].delta && response.choices[0].delta.content) {
                                        content += response.choices[0].delta.content;
                                    } else if (response.choices[0].message && response.choices[0].message.content) {
                                        content += response.choices[0].message.content;
                                    }
                                    
                                    if (onUpdate) {
                                        onUpdate(content);
                                    }
                                }

                                if (response.usage) {
                                    console.log('Token使用情况:', response.usage);
                                }
                            } catch (e) {
                                console.error('解析响应失败:', e, '原始数据:', line);
                            }
                        }
                    });

                    res.on('end', () => {
                        resolve({
                            choices: [
                                {
                                    message: {
                                        content: content
                                    }
                                }
                            ]
                        });
                    });
                });

                req.on('error', (error) => {
                    console.error('请求错误:', error);
                    reject(error);
                });

                req.write(JSON.stringify(data));
                req.end();
            } catch (error) {
                console.error('豆包API调用失败:', error);
                reject(error);
            }
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
                .addOption('moonshot', 'Moonshot')
                .addOption('glm', '智谱GLM')
                .addOption('qwen', '通义千问')
                .addOption('doubao', '豆包')
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

        // Moonshot设置
        if (this.plugin.settings.currentModel === 'moonshot') {
            containerEl.createEl('h3', {text: 'Moonshot设置'});
            
            new Setting(containerEl)
                .setName('启用Moonshot')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.moonshotConfig.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.moonshotConfig.enabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.moonshotConfig.enabled) {
                new Setting(containerEl)
                    .setName('API Key')
                    .setDesc('请输入您的Moonshot API Key')
                    .addText(text => text
                        .setPlaceholder('输入API Key')
                        .setValue(this.plugin.settings.moonshotConfig.apiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.moonshotConfig.apiKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Base URL')
                    .setDesc('Moonshot API的基础URL')
                    .addText(text => text
                        .setPlaceholder('https://api.moonshot.cn/v1')
                        .setValue(this.plugin.settings.moonshotConfig.baseUrl)
                        .onChange(async (value) => {
                            this.plugin.settings.moonshotConfig.baseUrl = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('模型版本')
                    .setDesc('选择Moonshot模型版本')
                    .addDropdown(dropdown => dropdown
                        .addOption('moonshot-v1-8k', 'Moonshot v1-8k')
                        .addOption('moonshot-v1-16k', 'Moonshot v1-16k')
                        .addOption('moonshot-v1-32k', 'Moonshot v1-32k')
                        .addOption('moonshot-v1-64k', 'Moonshot v1-64k')
                        .addOption('moonshot-v1-128k', 'Moonshot v1-128k')
                        .addOption('moonshot-v1-256k', 'Moonshot v1-256k')
                        .addOption('moonshot-v1-512k', 'Moonshot v1-512k')
                        .addOption('moonshot-v1-1024k', 'Moonshot v1-1024k')
                        .setValue(this.plugin.settings.moonshotConfig.model)
                        .onChange(async (value) => {
                            this.plugin.settings.moonshotConfig.model = value;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        // 智谱GLM设置
        if (this.plugin.settings.currentModel === 'glm') {
            containerEl.createEl('h3', {text: '智谱GLM设置'});
            
            new Setting(containerEl)
                .setName('启用智谱GLM')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.glmConfig.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.glmConfig.enabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.glmConfig.enabled) {
                new Setting(containerEl)
                    .setName('API Key')
                    .setDesc('请输入您的智谱GLM API Key')
                    .addText(text => text
                        .setPlaceholder('输入API Key')
                        .setValue(this.plugin.settings.glmConfig.apiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.glmConfig.apiKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Base URL')
                    .setDesc('智谱GLM API的基础URL')
                    .addText(text => text
                        .setPlaceholder('https://open.bigmodel.cn/api/paas/v4')
                        .setValue(this.plugin.settings.glmConfig.baseUrl)
                        .onChange(async (value) => {
                            this.plugin.settings.glmConfig.baseUrl = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('模型版本')
                    .setDesc('选择智谱GLM模型版本')
                    .addDropdown(dropdown => dropdown
                        .addOption('glm-4-plus', 'GLM-4 Plus')
                        .addOption('glm-4-0520', 'GLM-4 0520')
                        .addOption('glm-4-air', 'GLM-4 Air')
                        .addOption('glm-4-airx', 'GLM-4 AirX')
                        .addOption('glm-4-long', 'GLM-4 Long')
                        .addOption('glm-4-flashx', 'GLM-4 FlashX')
                        .addOption('glm-4-flash', 'GLM-4 Flash')
                        .setValue(this.plugin.settings.glmConfig.model)
                        .onChange(async (value) => {
                            this.plugin.settings.glmConfig.model = value;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        // 通义千问设置
        if (this.plugin.settings.currentModel === 'qwen') {
            containerEl.createEl('h3', {text: '通义千问设置'});
            
            new Setting(containerEl)
                .setName('启用通义千问')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.qwenConfig.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.qwenConfig.enabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.qwenConfig.enabled) {
                new Setting(containerEl)
                    .setName('API Key')
                    .setDesc('请输入您的通义千问 API Key')
                    .addText(text => text
                        .setPlaceholder('输入API Key')
                        .setValue(this.plugin.settings.qwenConfig.apiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.qwenConfig.apiKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Base URL')
                    .setDesc('通义千问 API的基础URL')
                    .addText(text => text
                        .setPlaceholder('https://dashscope.aliyuncs.com/compatible-mode/v1')
                        .setValue(this.plugin.settings.qwenConfig.baseUrl)
                        .onChange(async (value) => {
                            this.plugin.settings.qwenConfig.baseUrl = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('模型版本')
                    .setDesc('选择通义千问模型版本')
                    .addDropdown(dropdown => dropdown
                        .addOption('qwen-max', '通义千问-Max (最强推理能力)')
                        .addOption('qwen-plus', '通义千问-Plus (均衡)')
                        .addOption('qwen-turbo', '通义千问-Turbo (快速)')
                        .addOption('qwen-long', '通义千问-Long (长文本)')
                        .setValue(this.plugin.settings.qwenConfig.model)
                        .onChange(async (value) => {
                            this.plugin.settings.qwenConfig.model = value;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        // 豆包设置
        if (this.plugin.settings.currentModel === 'doubao') {
            containerEl.createEl('h3', {text: '豆包设置'});
            
            new Setting(containerEl)
                .setName('启用豆包')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.doubaoConfig.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.doubaoConfig.enabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.doubaoConfig.enabled) {
                new Setting(containerEl)
                    .setName('Access Key')
                    .setDesc('请输入您的VOLC_ACCESSKEY')
                    .addText(text => text
                        .setPlaceholder('输入Access Key')
                        .setValue(this.plugin.settings.doubaoConfig.accessKey)
                        .onChange(async (value) => {
                            this.plugin.settings.doubaoConfig.accessKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Secret Key')
                    .setDesc('请输入您的VOLC_SECRETKEY')
                    .addText(text => text
                        .setPlaceholder('输入Secret Key')
                        .setValue(this.plugin.settings.doubaoConfig.secretKey)
                        .onChange(async (value) => {
                            this.plugin.settings.doubaoConfig.secretKey = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('API Base URL')
                    .setDesc('豆包 API的基础URL')
                    .addText(text => text
                        .setPlaceholder('https://ark-cn-beijing.bytedance.net/api/v3')
                        .setValue(this.plugin.settings.doubaoConfig.baseUrl)
                        .onChange(async (value) => {
                            this.plugin.settings.doubaoConfig.baseUrl = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Endpoint ID')
                    .setDesc('请从火山方舟控制台获取您的推理端点ID')
                    .addText(text => text
                        .setPlaceholder('输入endpoint ID，例如：ep-20240826182225-kp7rp')
                        .setValue(this.plugin.settings.doubaoConfig.endpointId)
                        .onChange(async (value) => {
                            this.plugin.settings.doubaoConfig.endpointId = value;
                            this.plugin.settings.doubaoConfig.model = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Region')
                    .setDesc('API区域')
                    .addText(text => text
                        .setPlaceholder('cn-beijing')
                        .setValue(this.plugin.settings.doubaoConfig.region)
                        .onChange(async (value) => {
                            this.plugin.settings.doubaoConfig.region = value;
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

        // 问答格式设置
        containerEl.createEl('h3', {text: '问答格式设置'});
        
        new Setting(containerEl)
            .setName('问答格式模板')
            .setDesc('设置问答格式的模板，使用 {{question}} 表示问题，{{answer}} 表示回答')
            .addTextArea(text => text
                .setValue(this.plugin.settings.qaFormat.template)
                .onChange(async (value) => {
                    this.plugin.settings.qaFormat.template = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('问题占位符')
            .setDesc('用于替换问题的占位符')
            .addText(text => text
                .setValue(this.plugin.settings.qaFormat.questionPlaceholder)
                .onChange(async (value) => {
                    this.plugin.settings.qaFormat.questionPlaceholder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('回答占位符')
            .setDesc('用于替换回答的占位符')
            .addText(text => text
                .setValue(this.plugin.settings.qaFormat.answerPlaceholder)
                .onChange(async (value) => {
                    this.plugin.settings.qaFormat.answerPlaceholder = value;
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = InteractiveAIPlugin; 