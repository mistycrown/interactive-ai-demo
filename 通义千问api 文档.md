# 首次调用通义千问API

更新时间：2024-12-30 09:50:54

[产品详情](https://www.aliyun.com/product/bailian)

[我的收藏](https://help.aliyun.com/my_favorites.html)

百炼支持通过API调用大模型，涵盖OpenAI兼容接口、DashScope SDK等接入方式。

如果您已经熟悉大模型调用，也可以直接查看API参考文档[通义千问](https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api)。

本文以通义千问为例，引导您完成大模型API调用。您将了解到：

- 如何获取API Key
    
- 如何配置本地开发环境
    
- 如何调用通义千问API
    

## 账号设置

1. **注册账号**：如果没有阿里云账号，您需要先[注册](https://account.aliyun.com/register/qr_register.htm?oauth_callback=https%3A%2F%2Fbailian.console.aliyun.com%2F%3FapiKey%3D1)阿里云账号。
    
2. **开通百炼：**前往[百炼控制台](https://bailian.console.aliyun.com/#/model-market)，如果页面顶部显示以下消息，您需要**开通百炼的模型服务，以获得免费额度**。如果未显示该消息，则表示您已经开通。
    
    ![image](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/5298748271/p856749.png)
    
3. **获取API Key：**在控制台的右上角选择**API-KEY**，然后创建API Key**，**用于通过API调用大模型。
    
    ![image](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/3543255371/p895521.png)
    

## **配置API Key到环境变量**

建议您把API Key配置到环境变量，从而避免在代码里显式地配置API Key，降低泄漏风险。

**配置步骤**

## **选择开发语言**

选择您熟悉的语言或工具，用于调用大模型API。

Python

Node.js

Java

curl

其它语言

您可以通过OpenAI兼容的HTTP方式或DashScope的HTTP方式来调用百炼平台上的模型。模型列表请参考：[模型列表](https://help.aliyun.com/zh/model-studio/getting-started/models)。

> 若没有配置环境变量，请用百炼API Key将：-H "Authorization: Bearer $DASHSCOPE_API_KEY" \ 换为：-H "Authorization: Bearer sk-xxx" \ 。

OpenAI兼容-HTTP

DashScope-HTTP

您可以运行以下命令发送API请求：

```curl
curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "qwen-plus",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user", 
            "content": "你是谁？"
        }
    ]
}'
```

发送API请求后，可以得到以下回复：

```json
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "我是来自阿里云的大规模语言模型，我叫通义千问。"
            },
            "finish_reason": "stop",
            "index": 0,
            "logprobs": null
        }
    ],
    "object": "chat.completion",
    "usage": {
        "prompt_tokens": 22,
        "completion_tokens": 16,
        "total_tokens": 38
    },
    "created": 1728353155,
    "system_fingerprint": null,
    "model": "qwen-plus",
    "id": "chatcmpl-39799876-eda8-9527-9e14-2214d641cf9a"
}
```

# 模型列表

更新时间：2025-01-03 14:06:40

[产品详情](https://www.aliyun.com/product/bailian)

[我的收藏](https://help.aliyun.com/my_favorites.html)

百炼提供了丰富多样的模型选择，它集成了通义系列大模型和第三方大模型，涵盖文本、图像、音视频等不同模态。

## **旗舰模型**

|   |   |   |   |   |
|---|---|---|---|---|
|**旗舰模型**|![通义new](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/5848224271/p838707.png) **通义千问-Max**<br><br>适合复杂任务，推理能力最强|![通义new](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/5848224271/p838707.png) **通义千问-Plus**<br><br>效果、速度、成本均衡|![通义new](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/5848224271/p838707.png) **通义千问-Turbo**<br><br>适合简单任务，速度快、成本低|![通义new](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/5848224271/p838707.png) **Qwen-Long**<br><br>支持长达千万字文档，成本低|
|API调用模型名<br><br>（稳定版本）|qwen-max|qwen-plus|qwen-turbo|qwen-long|
|最大上下文长度<br><br>（Token数）|32,768|131,072|1,000,000|10,000,000|
|最低输入价格<br><br>（每千Token）|0.02元|0.0008元|0.0003元|0.0005元|
|最低输出价格<br><br>（每千Token）|0.06元|0.002元|0.0006元|0.002元|
你是谁？