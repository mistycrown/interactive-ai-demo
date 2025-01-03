# 基本信息

## 公开的服务地址[](https://platform.moonshot.cn/docs/api/chat#%E5%85%AC%E5%BC%80%E7%9A%84%E6%9C%8D%E5%8A%A1%E5%9C%B0%E5%9D%80)

```
https://api.moonshot.cn
```

Moonshot 提供基于 HTTP 的 API 服务接入，并且对大部分 API，我们兼容了 OpenAI SDK。

# 快速开始

## 单轮对话[](https://platform.moonshot.cn/docs/api/chat#%E5%8D%95%E8%BD%AE%E5%AF%B9%E8%AF%9D)

OpenAI 官方 SDK 支持 [Python(opens in a new tab)](https://github.com/openai/openai-python) 和 [Node.js(opens in a new tab)](https://github.com/openai/openai-node) 两种语言，使用 OpenAI SDK 和 Curl 与 API 进行交互的代码如下：

pythoncurlnode.js

```
curl https://api.moonshot.cn/v1/chat/completions \    -H "Content-Type: application/json" \    -H "Authorization: Bearer $MOONSHOT_API_KEY" \    -d '{        "model": "moonshot-v1-8k",        "messages": [            {"role": "system", "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。"},            {"role": "user", "content": "你好，我叫李雷，1+1等于多少？"}        ],        "temperature": 0.3   }'
```

其中 $MOONSHOT_API_KEY 需要替换为您在平台上创建的 API Key。

使用 OpenAI SDK 时运行文档中的代码时，需要保证 Python 版本至少为 3.7.1，Node.js 版本至少为 18，OpenAI SDK 版本不低于 1.0.0。

```
pip install --upgrade 'openai>=1.0'
```

> 我们可以这样简单检验下自己库的版本：
> 
> ```
> python -c 'import openai; print("version =",openai.__version__)'# 输出可能是 version = 1.10.0，表示当前 python 实际使用了 openai 的 v1.10.0 的库
> ```

## 多轮对话[](https://platform.moonshot.cn/docs/api/chat#%E5%A4%9A%E8%BD%AE%E5%AF%B9%E8%AF%9D)

上面的单轮对话的例子中语言模型将用户信息列表作为输入，并将模型生成的信息作为输出返回。 有时我们也可以将模型输出的结果继续作为输入的一部分以实现多轮对话，下面是一组简单的实现多轮对话的例子：

pythonnode.js

```
from openai import OpenAI client = OpenAI(    api_key = "$MOONSHOT_API_KEY",    base_url = "https://api.moonshot.cn/v1",) history = [    {"role": "system", "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。"}] def chat(query, history):    history.append({        "role": "user",         "content": query    })    completion = client.chat.completions.create(        model="moonshot-v1-8k",        messages=history,        temperature=0.3,    )    result = completion.choices[0].message.content    history.append({        "role": "assistant",        "content": result    })    return result print(chat("地球的自转周期是多少？", history))print(chat("月球呢？", history))
```

值得注意的是，随着对话的进行，模型每次需要传入的 token 都会线性增加，必要时，需要一些策略进行优化，例如只保留最近几轮对话。

# API 说明

## Chat Completion[](https://platform.moonshot.cn/docs/api/chat#chat-completion)

### 请求地址[](https://platform.moonshot.cn/docs/api/chat#%E8%AF%B7%E6%B1%82%E5%9C%B0%E5%9D%80)

```
POST https://api.moonshot.cn/v1/chat/completions
```

### 请求内容[](https://platform.moonshot.cn/docs/api/chat#%E8%AF%B7%E6%B1%82%E5%86%85%E5%AE%B9)

#### 示例[](https://platform.moonshot.cn/docs/api/chat#%E7%A4%BA%E4%BE%8B)

```
{    "model": "moonshot-v1-8k",    "messages": [        {            "role": "system",            "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。"        },        { "role": "user", "content": "你好，我叫李雷，1+1等于多少？" }    ],    "temperature": 0.3}
```

#### 字段说明[](https://platform.moonshot.cn/docs/api/chat#%E5%AD%97%E6%AE%B5%E8%AF%B4%E6%98%8E)

|字段|是否必须|说明|类型|取值|
|---|---|---|---|---|
|messages|required|包含迄今为止对话的消息列表|List[Dict]|这是一个结构体的列表，每个元素类似如下：`{"role": "user", "content": "你好"}` role 只支持 `system`,`user`,`assistant` 其一，content 不得为空|
|model|required|Model ID, 可以通过 List Models 获取|string|目前是 `moonshot-v1-8k`,`moonshot-v1-32k`,`moonshot-v1-128k` 其一|
|max_tokens|optional|聊天完成时生成的最大 token 数。如果到生成了最大 token 数个结果仍然没有结束，finish reason 会是 "length", 否则会是 "stop"|int|这个值建议按需给个合理的值，如果不给的话，我们会给一个不错的整数比如 1024。**特别要注意的是**，这个 `max_tokens` 是指您期待我们**返回**的 token 长度，而不是输入 + 输出的总长度。比如对一个 `moonshot-v1-8k` 模型，它的最大输入 + 输出总长度是 8192，当输入 messages 总长度为 4096 的时候，您最多只能设置为 4096，否则我们服务会返回不合法的输入参数（ invalid_request_error ），并拒绝回答。如果您希望获得“输入的精确 token 数”，可以使用下面的“计算 Token” API 使用我们的计算器获得计数|
|temperature|optional|使用什么采样温度，介于 0 和 1 之间。较高的值（如 0.7）将使输出更加随机，而较低的值（如 0.2）将使其更加集中和确定性|float|默认为 0，如果设置，值域须为 `[0, 1]` 我们推荐 0.3，以达到较合适的效果|
|top_p|optional|另一种采样方法，即模型考虑概率质量为 top_p 的标记的结果。因此，0.1 意味着只考虑概率质量最高的 10% 的标记。一般情况下，我们建议改变这一点或温度，但不建议 同时改变|float|默认 1.0|
|n|optional|为每条输入消息生成多少个结果|int|默认为 1，不得大于 5。特别的，当 temperature 非常小靠近 0 的时候，我们只能返回 1 个结果，如果这个时候 n 已经设置并且 > 1，我们的服务会返回不合法的输入参数(invalid_request_error)|
|presence_penalty|optional|存在惩罚，介于-2.0到2.0之间的数字。正值会根据新生成的词汇是否出现在文本中来进行惩罚，增加模型讨论新话题的可能性|float|默认为 0|
|frequency_penalty|optional|频率惩罚，介于-2.0到2.0之间的数字。正值会根据新生成的词汇在文本中现有的频率来进行惩罚，减少模型一字不差重复同样话语的可能性|float|默认为 0|
|response_format|optional|设置为 `{"type": "json_object"}` 可启用 JSON 模式，从而保证模型生成的信息是有效的 JSON。当你将 response_format 设置为 `{"type": "json_object"}` 时，**你需要在 prompt 中明确地引导模型输出 JSON 格式的内容，并告知模型该 JSON 的具体格式，否则将可能导致不符合预期的结果**。|object|默认为 {"type": "text"}|
|stop|optional|停止词，当全匹配这个（组）词后会停止输出，这个（组）词本身不会输出。最多不能超过 5 个字符串，每个字符串不得超过 32 字节|String, List[String]|默认 null|
|stream|optional|是否流式返回|bool|默认 false, 可选 true|

### 返回内容[](https://platform.moonshot.cn/docs/api/chat#%E8%BF%94%E5%9B%9E%E5%86%85%E5%AE%B9)

对非 stream 格式的，返回类似如下：

```
{    "id": "cmpl-04ea926191a14749b7f2c7a48a68abc6",    "object": "chat.completion",    "created": 1698999496,    "model": "moonshot-v1-8k",    "choices": [        {            "index": 0,            "message": {                "role": "assistant",                "content": " 你好，李雷！1+1等于2。如果你有其他问题，请随时提问！"            },            "finish_reason": "stop"        }    ],    "usage": {        "prompt_tokens": 19,        "completion_tokens": 21,        "total_tokens": 40    }}
```

对 stream 格式的，返回类似如下：

```
data: {"id":"cmpl-1305b94c570f447fbde3180560736287","object":"chat.completion.chunk","created":1698999575,"model":"moonshot-v1-8k","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]} data: {"id":"cmpl-1305b94c570f447fbde3180560736287","object":"chat.completion.chunk","created":1698999575,"model":"moonshot-v1-8k","choices":[{"index":0,"delta":{"content":"你好"},"finish_reason":null}]} ... data: {"id":"cmpl-1305b94c570f447fbde3180560736287","object":"chat.completion.chunk","created":1698999575,"model":"moonshot-v1-8k","choices":[{"index":0,"delta":{"content":"。"},"finish_reason":null}]} data: {"id":"cmpl-1305b94c570f447fbde3180560736287","object":"chat.completion.chunk","created":1698999575,"model":"moonshot-v1-8k","choices":[{"index":0,"delta":{},"finish_reason":"stop","usage":{"prompt_tokens":19,"completion_tokens":13,"total_tokens":32}}]} data: [DONE]
```

### 调用示例[](https://platform.moonshot.cn/docs/api/chat#%E8%B0%83%E7%94%A8%E7%A4%BA%E4%BE%8B)

对简单调用，见前面。对流式调用，可以参考如下代码片段：

pythoncurlnode.js

```
curl https://api.moonshot.cn/v1/chat/completions \  -H "Content-Type: application/json" \  -H "Authorization: Bearer $MOONSHOT_API_KEY" \  -d '{    "model": "moonshot-v1-8k",    "messages": [      {        "role": "system",        "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。"      },      {        "role": "user",        "content": "你好，我叫李雷，1+1等于多少？"      }    ],    "stream": true  }'
```

## List Models[](https://platform.moonshot.cn/docs/api/chat#list-models)

### 请求地址[](https://platform.moonshot.cn/docs/api/chat#%E8%AF%B7%E6%B1%82%E5%9C%B0%E5%9D%80-1)

```
GET https://api.moonshot.cn/v1/models
```

### 调用示例[](https://platform.moonshot.cn/docs/api/chat#%E8%B0%83%E7%94%A8%E7%A4%BA%E4%BE%8B-1)

pythoncurlnode.js

```
curl https://api.moonshot.cn/v1/models -H "Authorization: Bearer $MOONSHOT_API_KEY"
```

## 其它语言示例[](https://platform.moonshot.cn/docs/api/chat#%E5%85%B6%E5%AE%83%E8%AF%AD%E8%A8%80%E7%A4%BA%E4%BE%8B)

几乎所有的编程语言都可以兼容上面的接口，可以参考[我们的开源仓库(opens in a new tab)](https://github.com/MoonshotAI/MoonshotAI-Cookbook/)中提供的范例工程，例如：

- [Java SDK(opens in a new tab)](https://github.com/MoonshotAI/MoonshotAI-Cookbook/tree/master/examples/java_sdk)
- [Golang(opens in a new tab)](https://github.com/MoonshotAI/MoonshotAI-Cookbook/tree/master/examples/golang_demo)
- [.Net SDK(opens in a new tab)](https://github.com/MoonshotAI/MoonshotAI-Cookbook/tree/master/examples/dotnet_sdk)

## 错误说明[](https://platform.moonshot.cn/docs/api/chat#%E9%94%99%E8%AF%AF%E8%AF%B4%E6%98%8E)

以下是一组错误返回的例子：

```
{    "error": {        "type": "content_filter",        "message": "The request was rejected because it was considered high risk"    }}
```

下面是主要错误的说明：

|HTTP Status Code|error type|error message|详细描述|
|---|---|---|---|
|400|content_filter|The request was rejected because it was considered high risk|内容审查拒绝，您的输入或生成内容可能包含不安全或敏感内容，请您避免输入易产生敏感内容的提示语，谢谢|
|400|invalid_request_error|Invalid request: {error_details}|请求无效，通常是您请求格式错误或者缺少必要参数，请检查后重试|
|400|invalid_request_error|Input token length too long|请求中的 tokens 长度过长，请求不要超过模型 tokens 的最长限制|
|400|invalid_request_error|Your request exceeded model token limit : {max_model_length}|请求的 tokens 数和设置的 max_tokens 加和超过了模型规格长度，请检查请求体的规格或选择合适长度的模型|
|400|invalid_request_error|Invalid purpose: only 'file-extract' accepted|请求中的目的（purpose）不正确，当前只接受 'file-extract'，请修改后重新请求|
|400|invalid_request_error|File size is too large, max file size is 100MB, please confirm and re-upload the file|上传的文件大小超过了限制，请重新上传|
|400|invalid_request_error|File size is zero, please confirm and re-upload the file|上传的文件大小为 0，请重新上传|
|400|invalid_request_error|The number of files you have uploaded exceeded the max file count {max_file_count}, please delete previous uploaded files|上传的文件总数超限，请删除不用的早期的文件后重新上传|
|401|invalid_authentication_error|Invalid Authentication|鉴权失败，请检查 apikey 是否正确，请修改后重试|
|401|invalid_authentication_error|Incorrect API key provided|鉴权失败，请检查 apikey 是否提供以及 apikey 是否正确，请修改后重试|
|403|exceeded_current_quota_error|Your account {uid}<{ak-id}> is not active, current state: {current state}, you may consider to check your account balance|账户异常，请检查您的账户余额|
|403|permission_denied_error|The API you are accessing is not open|访问的 API 暂未开放|
|403|permission_denied_error|You are not allowed to get other user info|访问其他用户信息的行为不被允许，请检查|
|404|resource_not_found_error|Not found the model or Permission denied|不存在此模型或者没有授权访问此模型，请检查后重试|
|404|resource_not_found_error|Users {user_id} not found|找不到该用户，请检查后重试|
|429|engine_overloaded_error|The engine is currently overloaded, please try again later|当前并发请求过多，节点限流中，请稍后重试；建议充值升级 tier，享受更丝滑的体验|
|429|exceeded_current_quota_error|You exceeded your current token quota: {token_credit}, please check your account balance|账户额度不足，请检查账户余额，保证账户余额可匹配您 tokens 的消耗费用后重试|
|429|rate_limit_reached_error|Your account {uid}<{ak-id}> request reached max concurrency: {Concurrency}, please try again after {time} seconds|请求触发了账户并发个数的限制，请等待指定时间后重试|
|429|rate_limit_reached_error|Your account {uid}<{ak-id}> request reached max request: {RPM}, please try again after {time} seconds|请求触发了账户 RPM 速率限制，请等待指定时间后重试|
|429|rate_limit_reached_error|Your account {uid}<{ak-id}> request reached TPM rate limit, current:{current_tpm}, limit:{max_tpm}|请求触发了账户 TPM 速率限制，请等待指定时间后重试|
|429|rate_limit_reached_error|Your account {uid}<{ak-id}> request reached TPD rate limit,current:{current_tpd}, limit:{max_tpd}|请求触发了账户 TPD 速率限制，请等待指定时间后重试|
|500|server_error|Failed to extract file: {error}|解析文件失败，请重试|
|500|unexpected_output|invalid state transition|内部错误，请联系管理员|