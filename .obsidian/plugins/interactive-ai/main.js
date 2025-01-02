'use strict';

const DEFAULT_SETTINGS = {
    apiKey: ''
}

class InteractiveAIPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();

        // 添加插件设置选项卡
        this.addSettingTab(new InteractiveAISettingTab(this.app, this));

        // 添加命令 - 处理选中文本
        this.addCommand({
            id: 'process-selected-text',
            name: '处理选中的文本',
            editorCallback: (editor) => {
                const selectedText = editor.getSelection();
                if (selectedText) {
                    this.processSelectedText(selectedText);
                } else {
                    new obsidian.Notice('请先选择文本');
                }
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async processSelectedText(text) {
        if (!this.settings.apiKey) {
            new obsidian.Notice('请先在设置中配置API密钥');
            return;
        }

        // TODO: 实现讯飞星火API调用
        console.log('处理文本:', text);
    }
}

class InteractiveAISettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Interactive AI 设置'});

        new obsidian.Setting(containerEl)
            .setName('讯飞星火 API Key')
            .setDesc('请输入您的讯飞星火 API Key')
            .addText(text => text
                .setPlaceholder('输入API Key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = InteractiveAIPlugin; 