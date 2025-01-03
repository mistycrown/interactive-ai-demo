# Interactive AI Plugin for Obsidian

这是一个功能强大的Obsidian插件，它允许你直接在Obsidian中与多个AI模型进行交互。

## 功能特点

- 支持多个AI模型：
  - 讯飞星火
  - DeepSeek
  - Moonshot
  - 智谱GLM
  - 通义千问
  - 豆包
- 自定义提示词系统
- 支持选中文本快速发送到AI
- 支持多种文本交互操作方式：替换、追加、问答格式插入


## 配置说明

### 基础配置

1. 在插件设置中选择要使用的AI模型
2. 根据选择的模型配置相应的API密钥和设置

### 模型配置详情

#### 讯飞星火
- App ID
- API Key
- API Secret
- 支持多个模型版本选择（4.0Ultra/Max-32K/Pro等）

#### DeepSeek
- API Key
- Base URL配置

#### Moonshot
- API Key
- Base URL配置
- 支持多个模型版本（8k到1024k）

#### 智谱GLM
- API Key
- Base URL配置
- 支持多个模型版本（GLM-4系列）

#### 通义千问
- API Key
- Base URL配置
- 支持多个模型版本（Max/Plus/Turbo/Long）

#### 豆包
- Access Key (VOLC_ACCESSKEY)
- Secret Key (VOLC_SECRETKEY)
- Endpoint ID
- Region设置

## 使用方法

### 基本使用
1. 使用快捷键 `Ctrl+Alt+I`（Mac上使用 `Cmd+Alt+I`）打开AI助手侧边栏
2. 选择文本后右键，可以看到"Interactive AI"选项
3. 可以选择直接发送或使用预设提示词

### 自定义提示词
1. 在设置中添加自定义提示词
2. 使用 `{{text}}` 作为选中文本的占位符
3. 为提示词设置名称和内容

### 问答格式设置
- 可自定义问答的显示格式
- 使用 `{{question}}` 和 `{{answer}}` 作为占位符
- 支持Obsidian的Callout格式

### 操作按钮说明
- 替代：将AI回答替换选中的文本
- 追加：在选中文本后追加AI回答
- 问答：将问题和回答按设定格式插入

## 快捷键

- `Ctrl+Alt+I`（Mac上使用 `Cmd+Alt+I`）: 打开AI助手侧边栏
- 选中文本后可使用右键菜单进行快速操作

## 注意事项

1. 使用前需要配置相应模型的API密钥
2. 确保网络连接稳定
3. API调用可能产生费用，请查看相应服务商的计费规则
4. 建议在重要操作前进行文档备份

## 常见问题

1. **API调用失败**
   - 检查API密钥是否正确配置
   - 确认网络连接是否正常
   - 查看是否有足够的API额度

2. **模型响应慢**
   - 可能是网络问题
   - 尝试切换到响应更快的模型版本
   - 检查文本长度是否过长

3. **格式显示异常**
   - 检查问答格式设置是否正确
   - 确认是否使用了正确的占位符

## 更新日志

### v1.0.0
- 初始版本发布
- 支持多个AI模型接入
- 实现基础对话功能
- 添加自定义提示词系统

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个插件。

## 许可证

MIT License

