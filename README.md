# Interactive AI Plugin for Obsidian

这是一个用于 Obsidian 的交互式 AI 插件，支持多个大语言模型，包括：

- 讯飞星火
- DeepSeek
- Moonshot
- 智谱GLM
- 通义千问
- 豆包

## 功能特点

- 支持多个大语言模型，可以在设置中自由切换
- 支持引用笔记内容发送给 AI
- 支持自定义提示词
- 支持问答格式的 Callout
- 支持替换、插入、问答等多种操作
- 支持实时流式响应
- 支持快捷键操作

## 安装方法

1. 下载最新的 release
2. 解压到你的 Obsidian 插件目录
3. 在 Obsidian 中启用插件
4. 在插件设置中配置相应的 API 密钥

## 使用方法

1. 在侧边栏中打开 Interactive AI
2. 在设置中选择要使用的模型并配置 API 密钥
3. 可以直接在输入框中输入问题
4. 也可以选中笔记中的文本，右键选择"引用至Interactive AI"
5. 支持以下操作：
   - 替换：将 AI 的回答替换选中的文本
   - 插入：在当前位置插入 AI 的回答
   - 问答：将问题和回答以 Callout 格式插入

## 配置说明

1. 在插件设置中可以配置：
   - 选择使用的模型
   - 配置各个模型的 API 密钥
   - 自定义提示词
   - 设置问答格式模板

2. 问答格式支持自定义模板，默认格式为：
```markdown
> [!question] 问题
> {{question}}

> [!answer] 回答
> {{answer}}
```

## 开发说明

1. 克隆仓库
```bash
git clone https://github.com/yourusername/obsidian-interactive-ai.git
```

2. 安装依赖
```bash
npm install
```

3. 构建插件
```bash
npm run build
```

4. 开发模式
```bash
npm run dev
```

## 许可证

MIT License

