# ChatCompletions-文本生成



```HTTP
POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
```

本文介绍Doubao语言大模型API的输入输出参数，帮助您使用接口向大模型发起文字对话请求。服务会将输入的文字信息输入给模型，并返回模型生成的内容。  

鉴权方式

本接口支持 API Key 鉴权方式，详见[鉴权认证方式](https://www.volcengine.com/docs/82379/1298459)。

> 如果您需要使用Access Key来调用，可以使用接口来获取临时API Key，详细接口说明请参见[GetApiKey - 获取临时API](https://www.volcengine.com/docs/82379/1262825)

请求参数

## 请求体

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|model|String|是|-|您创建的[推理接入点](https://www.volcengine.com/docs/82379/1099522) ID|ep-2024**-**|
|messages|Array of [MessageParam](https://www.volcengine.com/docs/82379/1298454#messageparam)|是|-|由目前为止的对话组成的消息列表  <br>当指定了 `tools` 参数以使用模型的 function call 能力时，请确保 `messages` 列表内的消息满足如下要求：<br><br>- 如果 message 列表中前文出现了带有 n 个 `tool_calls` 的 Assistant Message，则后文必须有连续 n 个分别和每个 `tool_call_id` 相对应的 Tool Message，来回应 `tool_calls` 的信息要求|-|
|stream|Boolean|否|false|响应内容是否流式返回<br><br>- `false`：模型生成完所有内容后一次性返回结果<br>- `true`：按 SSE 协议逐块返回模型生成内容，并以一条 `data: [DONE]` 消息结束|false|
|stream_options|Array of[StreamOptionsParam](https://www.volcengine.com/docs/82379/1298454#streamoptionsparam)|否|-|流式响应的选项。仅当 `stream: true` 时可以设置 `stream_options` 参数。|-|
|max_tokens|Integer|否|4096|注意<br><br>- **模型回复最大长度（单位 token），取值范围为 [0, 4096]。**<br>- **输入 token 和输出 token 的总长度还受模型的上下文长度限制。**|4096|
|stop|String or Array|否|-|模型遇到 `stop` 字段所指定的字符串时将停止继续生成，这个词语本身不会输出。最多支持 4 个字符串。|["你好", "天气"]|
|frequency_penalty|Float|否|0|频率惩罚系数。如果值为正，会根据新 token 在文本中的出现频率对其进行惩罚，从而降低模型逐字重复的可能性。取值范围为 [-2.0, 2.0]。|1|
|presence_penalty|Float|否|0|存在惩罚系数。如果值为正，会根据新 token 到目前为止是否出现在文本中对其进行惩罚，从而增加模型谈论新主题的可能性。取值范围为 [-2.0, 2.0]。|1|
|temperature|Float|否|1|采样温度。控制了生成文本时对每个候选词的概率分布进行平滑的程度。取值范围为 [0, 1]。当取值为 0 时模型仅考虑对数概率最大的一个 token。  <br>较高的值（如 0.8）会使输出更加随机，而较低的值（如 0.2）会使输出更加集中确定。通常建议仅调整 `temperature` 或 `top_p` 其中之一，不建议两者都修改。|0.8|
|top_p|Float|否|0.7|核采样概率阈值。模型会考虑概率质量在 `top_p` 内的 token 结果。取值范围为 [0, 1]。当取值为 0 时模型仅考虑对数概率最大的一个 token。  <br>如 0.1 意味着只考虑概率质量最高的前 10% 的 token，取值越大生成的随机性越高，取值越低生成的确定性越高。通常建议仅调整 `temperature` 或 `top_p` 其中之一，不建议两者都修改。|0.8|
|logprobs|Boolean|否|false|是否返回输出 tokens 的对数概率。<br><br>- `false`：不返回对数概率信息<br>- `true`：返回消息内容中每个输出 token 的对数概率|false|
|top_logprobs|Integer|否|0|指定每个输出 token 位置最有可能返回的 token 数量，每个 token 都有关联的对数概率。仅当 `logprobs: true` 时可以设置 `top_logprobs` 参数，取值范围为 [0, 20]。|2|
|logit_bias|Map<String, Integer>|否|-|调整指定 token 在模型输出内容中出现的概率，使模型生成的内容更加符合特定的偏好。`logit_bias` 字段接受一个 map 值，其中每个键为词表中的 token ID（使用 tokenization 接口获取），每个值为该 token 的偏差值，取值范围为 [-100, 100]。  <br>-1 会减少选择的可能性，1 会增加选择的可能性；-100 会完全禁止选择该 token，100 会导致仅可选择该 token。该参数的实际效果可能因模型而异。<br><br>```json<br>{<br>    "1234": -100<br>}<br>```|-|
|tools|Array of [ToolParam](https://www.volcengine.com/docs/82379/1298454#toolparam)|否|-|模型可以调用的工具列表。目前，仅函数作为工具被支持。用这个来提供模型可能为其生成 JSON 输入的函数列表。|-|

## 数据结构

### MessageParam

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|role|String|是|-|发出该消息的对话参与者角色，可选值包括：<br><br>- `system`：System Message 系统消息<br>- `user`：User Message 用户消息<br>- `assistant`：Assistant Message 对话助手消息<br>- `tool`：Tool Message 工具调用消息|user|
|content|String/Array<br><br>> 多条消息时为Array。  <br>> 单条消息时为String。|否|-|消息内容<br><br>- 当 `role` 为 `system`、`user`、`tool`时，参数必填<br>- 当 `role` 为 `assistant` 时，`content` 与 `tool_calls` 参数二者至少填写其一|世界第一高山是什么？|
|tool_calls|Array of [MessageToolCallParam](https://www.volcengine.com/docs/82379/1298454#messagetoolcallparam)|否|-|模型生成的工具调用。当 `role` 为 `assistant` 时，`content` 与 `tool_calls` 参数二者至少填其一|-|
|tool_call_id|String|否|-|此消息所回应的工具调用 ID，当 `role` 为 `tool` 时必填|call_5y***********|

### MessageToolCallParam

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|id|String|是|-|当前工具调用 ID|call_5y**********|
|type|String|是|-|工具类型，当前仅支持`function`|function|
|function|[FunctionParam](https://www.volcengine.com/docs/82379/1298454#functionparam)|是|-|模型需要调用的函数|-|

### FunctionParam

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|name|String|是|-|模型需要调用的函数名称|get_current_weather|
|arguments|String|是|-|模型生成的用于调用函数的参数，JSON 格式。请注意，模型并不总是生成有效的 JSON，并且可能会虚构出一些您的函数参数规范中未定义的参数。在调用函数之前，请在您的代码中验证这些参数是否有效。|{"location": "Boston, MA"}|

### ToolParam

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|type|String|是|-|工具类型，当前仅支持 `function`|function|
|function|[FunctionDefinition](https://www.volcengine.com/docs/82379/1298454#functiondefinition)|是|-|模型可以调用的工具列表。|-|

### FunctionDefinition

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|name|String|是|-|函数的名称|get_current_weather|
|description|String|否|-|对函数用途的描述，供模型判断何时以及如何调用该工具函数|获取指定城市的天气信息|
|parameters|Object|否|-|函数请求参数，以 JSON Schema 格式描述。具体格式请参考 [JSON Schema](https://json-schema.org/understanding-json-schema) 文档<br><br>```json<br>{<br>    "type": "object",<br>    "properties": {<br>        "location": {<br>            "type": "string",<br>            "description": "城市，如：北京",<br>        },<br>    },<br>    "required": ["location"],<br>}<br>```|-|

### StreamOptionsParam

|参数名称|类型|是否必填|默认值|描述|示例值|
|---|---|---|---|---|---|
|include_usage|Boolean|否|false|是否包含本次请求的 token 用量统计信息<br><br>- `false`：不返回 token 用量信息<br>- `true`：在 `data: [DONE]` 消息之前返回一个额外的块，此块上的 `usage` 字段代表整个请求的 token 用量，`choices` 字段为空数组。所有其他块也将包含 `usage` 字段，但值为 `null`。|false|

响应参数

## 非流式调用

|参数名称|类型|描述|示例值|
|---|---|---|---|
|id|String|本次请求的唯一标识|02171********************|
|model|String|本次请求实际使用的模型名称和版本|doubao-pro-4k-240515|
|created|Integer|本次请求创建时间的 Unix 时间戳（秒）|1718049470|
|object|String|固定为 `chat.completion`|chat.completion|
|choices|Array of [Choice](https://www.volcengine.com/docs/82379/1298454#choice)|本次请求的模型输出内容|-|
|usage|[Usage](https://www.volcengine.com/docs/82379/1298454#usage)|本次请求的 tokens 用量|-|

## 流式调用

|参数名称|类型|描述|示例值|
|---|---|---|---|
|id|String|本次请求的唯一标识|02171804947|
|model|String|本次请求实际使用的模型名称和版本|doubao-pro-4k-240515|
|created|Integer|本次请求创建时间的 Unix 时间戳（秒）|1718049470|
|object|String|固定为 `chat.completion.chunk`|chat.completion.chunk|
|choices|Array of [StreamChoice](https://www.volcengine.com/docs/82379/1298454#streamchoice)|本次请求的模型输出内容|-|
|usage|[Usage](https://www.volcengine.com/docs/82379/1298454#usage)|本次请求的 tokens 用量|-|

## 数据结构

### Choice

|参数名称|类型|描述|示例值|
|---|---|---|---|
|index|Integer|当前元素在 `choices` 列表的索引|0|
|finish_reason|String|模型停止生成 token 的原因。取值范围：<br><br>- `stop`：模型输出自然结束，或因命中请求参数 `stop` 中指定的字段而被截断<br>- `length`：模型输出因达到请求参数 `max_token` 指定的最大 token 数量而被截断<br>- `content_filter`：模型输出被内容审核拦截<br>- `tool_calls`：模型调用了工具|stop|
|message|[Message](https://www.volcengine.com/docs/82379/1298454#message)|模型输出的内容|-|
|logprobs|[ChoiceLogprobs](https://www.volcengine.com/docs/82379/1298454#choicelogprobs)|当前内容的对数概率信息|-|

### Message

|参数名称|类型|描述|示例值|
|---|---|---|---|
|role|String|固定为 `assistant`|assistant|
|content|String|模型生成的消息内容，`content` 与 `tool_calls` 字段二者至少有一个为非空|"你好"|
|tool_calls|Array of [MessageToolCall](https://www.volcengine.com/docs/82379/1298454#messagetoolcall)|模型生成的工具调用，`content` 与 `tool_calls` 字段二者至少有一个为非空|-|

### MessageToolCall

|参数名称|类型|描述|示例值|
|---|---|---|---|
|id|String|当前工具调用 ID|call_5y********|
|type|String|工具类型，当前仅支持`function`|function|
|function|[Function](https://www.volcengine.com/docs/82379/1298454#function)|模型需要调用的函数|-|

### Function

|参数名称|类型|描述|示例值|
|---|---|---|---|
|name|String|模型需要调用的函数名称|get_current_weather|
|arguments|String|模型生成的用于调用函数的参数，JSON 格式。请注意，模型并不总是生成有效的 JSON，并且可能会虚构出一些您的函数参数规范中未定义的参数。在调用函数之前，请在您的代码中验证这些参数是否有效。|{"location": "Boston, MA"}|

### ChoiceLogprobs

|参数名称|类型|描述|示例值|
|---|---|---|---|
|content|Array of [TokenLogprob](https://www.volcengine.com/docs/82379/1298454#tokenlogprob)|`message`列表中每个 `content` 元素中的 token 对数概率信息|-|

### TokenLogprob

|参数名称|类型|描述|示例值|
|---|---|---|---|
|token|String|当前 token。|The|
|bytes|Array of Integer|当前 token 的 UTF-8 值，格式为整数列表。当一个字符由多个 token 组成（表情符号或特殊字符等）时可以用于字符的编码和解码。如果 token 没有 UTF-8 值则为空。|[84, 104, 101]|
|logprob|Float|当前 token 的对数概率。|-0.0155029296875|
|top_logprobs|Array of [TopLogprob](https://www.volcengine.com/docs/82379/1298454#toplogprob)|在当前 token 位置最有可能的标记及其对数概率的列表。在一些情况下，返回的数量可能比请求参数 `top_logprobs` 指定的数量要少。|-|

### TopLogprob

|参数名称|类型|描述|示例值|
|---|---|---|---|
|token|String|当前 token。|The|
|bytes|Array of Integer|当前 token 的 UTF-8 值，格式为整数列表。当一个字符由多个 token 组成（表情符号或特殊字符等）时可以用于字符的编码和解码。如果 token 没有 UTF-8 值则为空。|[84, 104, 101]|
|logprob|Float|当前 token 的对数概率。|-0.0155029296875|

### Usage

|参数名称|类型|描述|示例值|
|---|---|---|---|
|prompt_tokens|Integer|输入的 prompt token 数量|130|
|completion_tokens|Integer|模型生成的 token 数量|100|
|total_tokens|Integer|本次请求消耗的总 token 数量（输入 + 输出）|240|
|prompt_tokens_details|Object|prompt_tokens中命中上下文缓存的tokens数。需要开通上下文缓存功能，并创建缓存才会启用，详细见[上下文缓存（Context API）概述](https://www.volcengine.com/docs/82379/1398933)。<br><br>```JSON<br>"prompt_tokens_details": {<br>    "cached_tokens": 0<br>}<br>```|-|

### StreamChoice

|参数名称|类型|描述|示例值|
|---|---|---|---|
|index|Integer|当前元素在 `choices` 列表的索引|0|
|finish_reason|String|模型停止生成 token 的原因。可能的值包括：<br><br>- `stop`：模型输出自然结束，或因命中请求参数 `stop` 中指定的字段而被截断<br>- `length`：模型输出因达到请求参数 `max_token` 指定的最大 token 数量而被截断<br>- `content_filter`：模型输出被内容审核拦截<br>- `tool_calls`：模型调用了工具|stop|
|delta|[ChoiceDelta](https://www.volcengine.com/docs/82379/1298454#choicedelta)|模型输出的内容。|-|
|logprobs|[ChoiceLogprobs](https://www.volcengine.com/docs/82379/1298454#choicelogprobs)|当前内容的对数概率信息。|-|

### ChoiceDelta

|参数名称|类型|描述|示例值|
|---|---|---|---|
|role|String|固定为 `assistant`|assistant|
|content|String|模型生成的消息内容，`content` 与 `tool_calls` 字段二者必有一个为非空|"你好"|
|tool_calls|Array of [ChoiceDeltaToolCall](https://www.volcengine.com/docs/82379/1298454#choicedeltatoolcall)|模型生成的工具调用列表，`content` 与 `tool_calls` 字段二者必有一个为非空|-|

### ChoiceDeltaToolCall

|参数名称|类型|描述|示例值|
|---|---|---|---|
|index|Interger|当前元素在 `tool_calls` 列表的索引|0|
|id|String|当前工具调用 ID|call_5y***********|
|type|String|工具类型，当前仅支持`function`|function|
|function|[Function](https://www.volcengine.com/docs/82379/1298454#function)|模型需要调用的函数|-|

请求示例

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea764f0f-3b60-45b3-****-************" \
  -d '{
    "model": "ep-20240704******-*****",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
```

响应示例

```json
{
    "id": "021718067849899d92fcbe0865fdffdde********************",
    "object": "chat.completion",
    "created": 1720582714,
    "model": "doubao-pro-32k-240615",
    "choices": [{
        "index": 0,
        "message": {
            "role": "assistant",
            "content": "Hello, can i help you with something?"
        },
        "logprobs": null,
        "finish_reason": "stop"
    }],
    "usage": {
        "prompt_tokens": 22,
        "completion_tokens": 9,
        "total_tokens": 31，
        "prompt_tokens_details": {
            "cached_tokens": 0
        }
    }
}
```

错误处理

## 错误响应

本接口调用失败的返回结构和参数释义请参见[返回结构](https://www.volcengine.com/docs/82379/1298460)文档。  

## 错误码

本接口与业务逻辑相关的错误码如下表所示。公共错误码请参见公共错误码文档。

|HTTP 状态码|错误类型 type|错误代码 code|错误信息 message|含义|
|---|---|---|---|---|
|400|

# 文本生成

最近更新时间：2024.12.19 15:43:44首次发布时间：2024.12.16 20:50:46

[我的收藏](https://www.volcengine.com/docs/favorite)

语言大模型具备文本理解和文字对话的能力。如当您传入文本信息时，大模型可以理解信息，并结合这些信息进行回复。通过这篇教程，您可以学习到如何使用模型服务 API，来调用模型理解文本，并生成文本内容，并可以基于此 API 构建或者扩展自己的应用或者自动化任务。  

应用场景

您可以在以下场景中使用模型的文本生成能力。

|场景|场景细分|描述|
|---|---|---|
|内容创作|文章生成|自动生成文章、新闻、评论等实用文本，提高内容产出效率。|
|文本润色|在新闻报道、博客文章创作中辅助作者进行创意构思和文本润色。|
|智能交互|智能客服|在客服系统中生成自然流畅的回复，提升用户体验。|
|聊天机器人|在线咨询、英语学习等领域，理解用户意图、按照要求并生成回复。|
|个性化教学|学科问题解答|分析题目、考点说明、解题思路、解题结果。|
|语言学习|按照要求，进行某些语种对话，帮助用户习惯目标语言日常交流。|
|机器翻译|自动翻译|结合语音类模型，实现同声传译、日常字幕生成、文本语言翻译等等。|
|工作处理|数据处理|根据读入的数据，根据任务要求进行处理，如读取研报、分析新闻、评价内容等。|

前提条件

- 您已有方舟 API Key，作为模型推理服务调用鉴权使用。如无，请参考[1.获取 API Key](https://www.volcengine.com/docs/82379/1399008#10d67aef)。
- 您已创建推理接入点，其中模型请选择视语言类大模型。如无，请参考[2.创建在线推理接入点（Endpoint）](https://www.volcengine.com/docs/82379/1399008#93d221a3)。

快速开始

支持文本生成的大模型当前支持在请求中传入图片链接，图片信息需要作为用户角色输入信息传给大模型，即`"role": "user"`，下面是简单的视觉模型调用示例代码。

```Python
import os
# 通过 pip install volcengine-python-sdk[ark] 安装方舟SDK
from volcenginesdkarkruntime import Ark

# 从环境变量中获取您的API KEY，配置方法见  。
api_key = os.getenv('ARK_API_KEY')
# 替换为您的推理接入点ID，创建方法见 
model = "<YOUR_ENDPOINT_ID>"

# 初始化Ark客户端
client = Ark(api_key = api_key)

# 创建一个对话请求
completion = client.chat.completions.create(
    model = model,
    messages = [
        {"role": "user", "content": "请将下面内容进行结构化处理：火山方舟是火山引擎推出的大模型服务平台，提供模型训练、推理、评测、精调等全方位功能与服务，并重点支撑大模型生态。 火山方舟通过稳定可靠的安全互信方案，保障模型提供方的模型安全与模型使用者的信息安全，加速大模型能力渗透到千行百业，助力模型提供方和使用者实现商业新增长。"},
    ],
)

print(completion.choices[0].message.content)
```

模型回复预览：

```Shell
**一、火山方舟的所属与定位**
火山方舟是火山引擎推出的大模型服务平台。

**二、火山方舟的功能与服务**
1. 提供全方位功能
   - 包括模型训练、推理、评测、精调等功能与服务。
2. 重点支撑
   - 重点支撑大模型生态。

**三、火山方舟的安全保障与作用**
1. 安全保障
   - 通过稳定可靠的安全互信方案，保障模型提供方的模型安全与模型使用者的信息安全。
2. 作用
   - 加速大模型能力渗透到千行百业，助力模型提供方和使用者实现商业新增长。
```

选择模型

当前支持文本生成的模型有如下这些：

- **[Doubao-pro ［热门］](https://www.volcengine.com/docs/82379/1330310#00bbadc1)**：是字节推出的专业版大模型，在能力上突出，在参考问答、摘要总结、创作等广泛的应用场景上能提供优质的回答，是同时具备高质量与低成本的极具性价比模型。本系列模型根据角色扮演、工具调用、超长文本等细分领域推出加强版本，建议您首先尝试该系列模型对应领域的最新的版本，以获取更强的模型能力。
- **[Doubao-lite](https://www.volcengine.com/docs/82379/1330310#5d9e965a)**：是字节推出的轻量级大模型，具备极致的响应速度，且推理单价更便宜，适合不复杂的任务处理，或者对于时延有更高要求的场景。同时，模型配合精调使用可以获得更优质的效果。同样该系列模型也推出了角色扮演、长文本等细分领域加强的模型，供您选择。
- **[Doubao-vision](https://www.volcengine.com/docs/82379/1330310#2697e7c5)**：多模态大模型，具备强大的图片理解与推理能力，以及精准的指令理解能力，能够应用于复杂的视觉问答任务。如果您的任务中会需要理解图片/视频，推荐您尝试此系列模型。
- **[第三方模型](https://www.volcengine.com/docs/82379/1330310#875e937f)**：还支持月之暗面、智谱、Mistral AI 等第三方提供的语言模型。

更多模型选择的建议：

- 选择最新的模型：如果您首次选择模型，推荐您选择对应系列最新版本模型。如`doubao-pro-32k 240828`能力强于`doubao-pro-32k 240615` 10%左右，尤其在文本分类、内容创作等能力大幅提升。
- 选择对应领域的模型：如果您在角色扮演、工具调用等领域，推荐您选择对应领域加强的模型。可以在[模型列表](https://www.volcengine.com/docs/82379/1330310)看到。
    - 联网总结：模型版本中带`browsing`字段的模型，配合联网插件使用，在网页内容总结方面具有更好的效果，信息检索回答任务全面提升，回答更准确、更少冗余内容。
    - 工具调用：模型版本中带`functioncall`字段的模型，对任务解析与函数调用的能力进行了重点优化，在调用预定义函数、获取外部信息方面都有更好的效果。如您使用大模型时需要调用函数或者其他接口时可选该类模型。
    - 角色扮演：模型版本中带`character`字段的模型，针对性提高角色扮演与情感陪伴能力，具备更强的上下文感知与剧情推动能力，多轮对话、智能交互类场景可以选择该模型。
    - 长文本：模型名称中带`128k`、`256k`字段的模型，可以输入 20 万字（`128k`）、40 万字（`256k`）左右的上下文，您进行如文本分类与信息抽取、小说全文总结摘要等长文本分析场景可以选择该类模型。
    - 通用任务：应对通用任务，适合绝大部分场景，如果您业务不在前面所述特定领域，即可选择该类模型。

计费说明

模型计费说明请参见[大语言模型](https://www.volcengine.com/docs/82379/1099320#%E5%A4%A7%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B%EF%BC%9A)。  

编写提示词

提示词（Prompt）是输入给模型的信息，模型会根据提示词来进行推理，生成回复内容。正确设计和编写提示词，如提供说明、示例、好的规范等方法可以提高模型输出的质量和准确性。而进行提示词优化的工作也被称为提示词工程（Prompt Engineering）。

> 我们为您提供了如何编辑好的提示词的一些实践[Prompt 最佳实践](https://www.volcengine.com/docs/82379/1221660)，您可以基于实践来优化提示词，以获得更好的回复。

下面为您介绍如何使用 `chatcompletions` 接口，将提示词正确输入给模型。  
在 [ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)中，您可以通过 `messages` 对象将信息传入给模型，其中`role`字段定义信息传入的角色，`content`承载消息内容。模型会结合传入的角色和信息来理解内容，并生成对应的回复。  

## 用户消息

最终用户传入给模型消息，此时 `role` 字段应设置为`user`，该类型消息往往是包含用户希望模型处理的具体任务或者处理的信息。  
下面就是一个简单的用户消息，要求模型对文本进行结构化处理。

```Shell
messages = [
    {"role": "user", "content": "请将下面内容进行结构化处理：火山方舟是火山引擎推出的大模型服务平台，提供模型训练、推理、评测、精调等全方位功能与服务，并重点支撑大模型生态。 火山方舟通过稳定可靠的安全互信方案，保障模型提供方的模型安全与模型使用者的信息安全，加速大模型能力渗透到千行百业，助力模型提供方和使用者实现商业新增长。"}
]
```

## 系统消息

用于指定模型扮演角色或交代背景信息，此时 `role` 字段应设置为`system`。如果设置系统消息，请放在`messages`列表的第一位。  
下面是一个系统消息示例，模型会作为文本转化工具进行结构化处理。

```Shell
messages =[
    {"role": "system", "content": "你是一个文本转化器，能够将输入的文本进行结构化处理。你收到信息后，只返回结构化处理后的内容，不应该返回其他内容。"},
    {"role": "user", "content": "请将下面内容进行结构化处理：火山方舟是火山引擎推出的大模型服务平台，提供模型训练、推理、评测、精调等全方位功能与服务，并重点支撑大模型生态。 火山方舟通过稳定可靠的安全互信方案，保障模型提供方的模型安全与模型使用者的信息安全，加速大模型能力渗透到千行百业，助力模型提供方和使用者实现商业新增长。"},
]
```

## 模型消息

假定为模型返回的消息，此时`role`字段应设置为`assistant`。在多轮对话中，会需要传入历史的对话，而模型回复的消息就可以用模型消息表示。

```Shell
messages =[
    {"role": "system", "content": "你是个十进制计算器，只返回结算结果，不返回其他"},
    {"role": "user", "content": "一加一"},
    {"role": "assistant", "content": "2"},
    {"role": "user", "content": "再加一"},
]
```

使用规格及建议

- 每个模型输出有几个关键的限制，各个模型详细的规格信息，请参见 [模型列表](https://www.volcengine.com/docs/82379/1330310)。
    - 最大上下文长度（Context Window）：即单次请求模型能处理的内容长度，包括输入的内容和模型输出的内容，单位 token ，超出最大上下文长度的内容会被截断处理，这会导致模型处理信息时丢失部分信息或者输出丢信息被截断。如碰到上下文限制导致的内容截断，可以选择支持更大最大上下文长度规格的模型，如`doubao-pro-128k`、`doubao-pro-256k`等模型名称中带`128k`、`256k`字段的模型。
    - 最大输出长度（Max Output Tokens）：即单次模型输出的内容的最大长度，内容过长会被截断。如果碰到这种情况，可以参考[Prefill Response模式最佳实践](https://www.volcengine.com/docs/82379/1359497)，实现多次回复，拼接出完整回复。
    - 每分钟处理内容量（TPM）：即账号下同模型（不区分版本）每分钟能处理的内容量限制，单位 token。如果默认 TPM 限制无法满足您的业务，您可以通过[工单](https://console.volcengine.com/workorder/create?step=2&SubProductID=P00001166)联系我们提升配额。
        
        > 举例来说：一个主账号下，创建doubao-pro-32k a、b、c 3个版本的A、B 、C 3个推理接入点，某模型的 TPM 为80w。那么某分钟，A、B、C 3个节点处理内容量 A 20w token、B 50w token、C 20w token，就会在触发80w TPM限制，并产生报错。
        
    - 每秒钟处理请求数（QPS）：即账号下同模型（不区分版本）每分钟能处理的请求数上限，与上面TPM类似。如果默认 QPS 限制无法满足您的业务，您可以通过[工单](https://console.volcengine.com/workorder/create?step=2&SubProductID=P00001166)联系我们提升配额。

对于token用量，您可以使用接口[Tokenization-分词](https://www.volcengine.com/docs/82379/1337112)来计算。  

示例：单轮对话

与模型进行一次交互，交互内容为单轮对话，模型根据系统消息和用户消息来返回内容。

> 因为是非流式输出，需要等待模型推理完所有内容，将内容一起返回给您，会有一定延时。

```Python
import os
from volcenginesdkarkruntime import Ark
# 从环境变量中获取您的API KEY，配置方法见  。
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

completion = client.chat.completions.create(
    # 替换为您的推理接入点ID，创建方法见 
    model="<YOUR_ENDPOINT_ID>",
    messages=[
        {"role": "system", "content": "你是豆包，是由字节跳动开发的 AI 人工智能助手"},
        {"role": "user", "content": "常见的十字花科植物有哪些？"},
    ],
)
print(completion.choices[0].message.content)
```

示例：多轮对话

组合使用系统消息、模型消息以及用户消息，可以实现多轮对话，即根据一个主题进行多次对话。  
需要注意，`chat.completions`接口是无状态的，在每次请求时，将历史信息都放在`messages`中，并通过`role`字段设置，让模型了解之前不同角色的不同对话内容，以便进行主题相关的延续性对话。

```Python
import os
from volcenginesdkarkruntime import Ark
# 从环境变量中获取您的API KEY，配置方法见  。
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

completion = client.chat.completions.create(
    # 替换为您的推理接入点ID，创建方法见 
    model="<YOUR_ENDPOINT_ID>",
    messages = [
        {"role": "system", "content": "你是豆包，是由字节跳动开发的 AI 人工智能助手"},
        {"role": "user", "content": "花椰菜是什么？"},
        {"role": "assistant", "content": "花椰菜又称菜花、花菜，是一种常见的蔬菜。"},
        {"role": "user", "content": "再详细点"},
    ],
)
print(completion.choices[0].message.content)
```

示例：流式输出

随着大模型输出，动态输出内容。无需等待模型推理完毕，即可看到中间输出过程内容，可以缓解用户等待体感（一边输出一边看内容），效果如下所示。  

```python
import os
from volcenginesdkarkruntime import Ark
# 从环境变量中获取您的API KEY，配置方法见  。
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

print("----- streaming request -----")
stream = client.chat.completions.create(
    # 替换为您的推理接入点ID，创建方法见 
    model="<YOUR_ENDPOINT_ID>",
    messages = [
        {"role": "system", "content": "你是豆包，是由字节跳动开发的 AI 人工智能助手"},
        {"role": "user", "content": "常见的十字花科植物有哪些？"},
    ],
    stream=True
)
for chunk in stream:
    if not chunk.choices:
        continue
    print(chunk.choices[0].delta.content, end="")
print()
```

示例：异步输出

当您的任务较为复杂或者多个任务并发等场景下，您可以使用Asyncio接口实现并发调用，提高程序的效率，优化体验。示例代码如下：

```python
import asyncio
import os
from volcenginesdkarkruntime import AsyncArk
# 从环境变量中获取您的API KEY，配置方法见  。
client = AsyncArk(api_key=os.environ.get("ARK_API_KEY"))

async def main() -> None:
    stream = await client.chat.completions.create(
        # 替换为您的推理接入点ID，创建方法见 
        model="<YOUR_ENDPOINT_ID>",
        messages=[
            {"role": "system", "content": "你是豆包，是由字节跳动开发的 AI 人工智能助手"},
            {"role": "user", "content": "常见的十字花科植物有哪些？"},
        ],
        stream=True
    )
    async for completion in stream:
        print(completion.choices[0].delta.content, end="")
    print()


asyncio.run(main())
```

示例：Function call

```python
import os
from volcenginesdkarkruntime import Ark

# 从环境变量中获取您的API KEY，配置方法见  。
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

print("----- function call request -----")
completion = client.chat.completions.create(
    # 替换为您的推理接入点ID，创建方法见 
    model="<YOUR_ENDPOINT_ID>",
    messages = [
        {"role": "user", "content": "北京今天天气如何？"},
    ],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "获取给定地点的天气",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "地点的位置信息，比如北京"
                        },
                        "unit": {
                            "type": "string",
                            "enum": [
                                "摄氏度",
                                "华氏度"
                            ]
                        }
                    },
                    "required": [
                        "location"
                    ]
                }
            }
        }
    ]
)
print(completion.choices[0])
```

示例：异常处理

增加异常处理，帮助定位问题。

```Python
import os
from volcenginesdkarkruntime._exceptions import ArkAPIError
from volcenginesdkarkruntime import Ark

# 从环境变量中获取您的API KEY，配置方法见  。
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

# Streaming:
print("----- streaming request -----")
try:
    stream = client.chat.completions.create(
        # 替换为您的推理接入点ID，创建方法见 
        model="<YOUR_ENDPOINT_ID>",
        messages=[
            {"role": "system", "content": "你是豆包，是由字节跳动开发的 AI 人工智能助手"},
            {"role": "user", "content": "常见的十字花科植物有哪些？"},
        ],
        stream=True
    )
    for chunk in stream:
        if not chunk.choices:
            continue

        print(chunk.choices[0].delta.content, end="")
    print()
except ArkAPIError as e:
    print(e)
```

示例：Prefill Response模式

通过预填（Prefill）部分`Assistant` 角色的内容，来引导和控制模型的输出。输出的控制可以应用在多个方面：强制按照 JSON 或 XML 等特定格式输出；跳过已生成的内容，避免触发模型最大输出限制；控制大模型在角色扮演场景中保持同一角色。

> - 支持的模型：[Doubao-pro ［热门］](https://www.volcengine.com/docs/82379/1330310#00bbadc1)、[Doubao-lite](https://www.volcengine.com/docs/82379/1330310#5d9e965a) 0828版本及以后。
> - 更详细的场景使用说明，请参见[Prefill Response模式最佳实践](https://www.volcengine.com/docs/82379/1359497)。

```Python
import os
from volcenginesdkarkruntime import Ark

# 从环境变量中获取您的API KEY，配置方法见  。
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

completion = client.chat.completions.create(
    # 替换为您的推理接入点ID，创建方法见 
    model="<YOUR_ENDPOINT_ID>",
    messages=[
        {"role": "user", "content": "你是一个计算器，请计算： 1 + 1 "},
        # 最后Role为Assistant，并补充部分内容，便于模型进行续写
        {"role": "assistant", "content": "="}
    ]
)
print(completion.choices[0].message.content)
```

示例：对话加密

为了保证推理会话数据的传输安全，在默认的网络层加密方案基础上，为在线推理的会话数据提供了端到端应用层加密方案，更多能力介绍和原理信息请参见[推理会话数据应用层加密方案](https://www.volcengine.com/docs/82379/1389905)。  
您可以通过增加一行代码免费使用本功能。

> - 使用要求
>     - 需要保证 SDK 版本 `volcengine-python-sdk` `1.0.104`及以上。可以通过 `pip install 'volcengine-python-sdk[ark]' -U` 获得 SDK 的最新版本。
> - 使用限制
>     - 仅支持 [Access Key](https://www.volcengine.com/docs/6257/64983) 初始化。
>     - 仅支持豆包文生文语言模型。
>     - 仅支持 `ChatCompletions` 中的单轮/多轮会话，支持流式/非流式，同步/异步接口。

示例代码如下

```Python
import os
from volcenginesdkarkruntime import Ark

# 从环境变量中获取您的API KEY，配置方法见  。
ak = os.environ.get("VOLC_ACCESSKEY")
sk = os.environ.get("VOLC_SECRETKEY")
client = Ark(ak=ak, sk=sk)

print("----- standard request -----")
completion = client.chat.completions.create(
    # 替换为您的推理接入点ID，创建方法见 
    model="<YOUR_ENDPOINT_ID>",
    messages = [
        {"role": "system", "content": "你是豆包，是由字节跳动开发的 AI 人工智能助手"},
        {"role": "user", "content": "常见的十字花科植物有哪些？"},
    ],
    #按下述代码设置自定义header，免费开启推理会话应用层加密
    extra_headers={'x-is-encrypted': 'true'}
)
print(completion.choices[0].message.content)
```

相关文档

- [ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)：文本生成的API参数说明，调用模型的文本生成能力，可参考文本生成API参数说明。
- [常见问题](https://www.volcengine.com/docs/82379/1359411)-[在线推理](https://www.volcengine.com/docs/82379/1359411#aa45e6c0)：在线推理的常见问题，如果等到错误，可以尝试在这里找解决方案。
- [Prefill Response模式最佳实践](https://www.volcengine.com/docs/82379/1359497)：提升多轮对话角色一致性，优化模型回复格式，缓解模型输出最大限制，您尝试文中方案。


# 模型列表

方舟提供丰富的模型，供您使用。您可以根据教程或API说明方便地将模型服务结合到您的业务中。  

模型推荐

|[Doubao-pro](https://www.volcengine.com/docs/82379/1330310#00bbadc1)|[Doubao-lite](https://www.volcengine.com/docs/82379/1330310#5d9e965a)|[Doubao-vision](https://www.volcengine.com/docs/82379/1330310#2697e7c5)|
|---|---|---|
|专业版大模型，在参考问答、摘要总结、创作等广泛的应用场景上能提供优质的回答，是同时具备高质量与低成本的极具性价比模型。<br><br>- 256k 最大上下文长度<br>- 高质量，低成本，极具性价比|轻量级大模型，具备极致的响应速度，适用于对时延有更高要求的场景，模型配合精调使用可以获得更优质的效果。<br><br>- 128k 最大上下文长度<br>- 更快，更便宜|多模态大模型，具备强大的图片理解与推理能力，以及精准的指令理解能力。能够应用于更复杂、更广泛的视觉问答任务。<br><br>- 32k 上下文长度/ 50 张图片<br>- 低成本，强能力|

输入输出

您可以根据通过下表结合您业务的输出输出信息类型，来快速筛选您需要的模型。

- ×：不支持。
- √：支持。

|模型名称|输入|   |   |输出|   |   |
|---|---|---|---|---|---|---|
|文本|图像|音频|文本|图像|音频|
|---|---|---|---|---|---|
|[Doubao-pro](https://www.volcengine.com/docs/82379/1330310#00bbadc1)|√|×|×|√|×|×|
|[Doubao-lite](https://www.volcengine.com/docs/82379/1330310#5d9e965a)|√|×|×|√|×|×|
|[Doubao-vision](https://www.volcengine.com/docs/82379/1330310#2697e7c5)|√|√|×|√|×|×|
|[Doubao-embedding](https://www.volcengine.com/docs/82379/1330310#1950ee13)|√|×|×|√|×|×|
|[Doubao-文生图](https://www.volcengine.com/docs/82379/1330310#433d3be0)|√|×|×|×|√|×|
|[Doubao-图生图](https://www.volcengine.com/docs/82379/1330310#5c2e8c65)|√|√|×|×|√|×|
|[豆包语音合成大模型](https://www.volcengine.com/docs/82379/1330310#1395a7e5)|√|×|√|×|×|√|
|[豆包声音复刻大模型](https://www.volcengine.com/docs/82379/1330310#2d3d78b1)|×|×|√|×|×|√|
|[豆包语音识别大模型](https://www.volcengine.com/docs/82379/1330310#6160b7dc)|×|×|√|√|×|×|

文本生成

## Doubao-pro

教程：[文本生成](https://www.volcengine.com/docs/82379/1399009) | API：[ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)  
行业领先的专业版大模型，在参考问答、摘要总结、创作等广泛的应用场景上能提供优质的回答，是同时具备高质量与低成本的极具性价比模型。

|**模型名称**|**版本**|**模型领域**|**最大上下文长度**  <br>(token)|**最大输出长度**  <br>(token)|**免费额度**  <br>（token）|**定价**  <br>(元/千 token)|
|---|---|---|---|---|---|---|
|Doubao-pro-4k|240515|通用任务|4k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-240728|角色扮演|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-240515|角色扮演|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|functioncall-240615|工具调用|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|functioncall-240515|工具调用|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|browsing-240524|联网总结<br><br>> 默认不联网，需要结合[联网插件](https://www.volcengine.com/docs/82379/1285209)使用。|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|Doubao-pro-32k|241215|通用任务|32k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240828|通用任务|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240615|通用任务|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|functioncall-241028|工具调用|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|functioncall-preview|工具调用|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|functioncall-240815|工具调用|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|functioncall-240515|工具调用|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|browsing-240828|联网总结<br><br>> 默认不联网，需要结合[联网插件](https://www.volcengine.com/docs/82379/1285209)使用。|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|browsing-240615|联网总结<br><br>> 默认不联网，需要结合[联网插件](https://www.volcengine.com/docs/82379/1285209)使用。|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-241215|角色扮演|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-240828|角色扮演|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-240528|角色扮演|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|Doubao-pro-128k|240628|长文本|128k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240515|长文本|128k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|Doubao-pro-256k|240828|超长文本|256k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|

## Doubao-lite

教程：[文本生成](https://www.volcengine.com/docs/82379/1399009) | API：[ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)  
轻量级大模型，具备极致的响应速度，适用于对时延有更高要求的场景，模型配合精调使用可以获得更优质的效果。

|**模型名称**|**版本**|**模型领域**|**最大上下文长度**  <br>(token)|**最大输出长度**  <br>(token)|**免费额度**  <br>（token）|**定价**  <br>(元/千 token)|
|---|---|---|---|---|---|---|
|Doubao-lite-4k|240328|通用任务|4k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|pretrain-character-240516|角色扮演|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-240828|角色扮演|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-240515|角色扮演|4k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|Doubao-lite-32k|241215|通用任务|32k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240828|通用任务|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240628|通用任务|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240428|通用任务|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|character-241015|角色扮演|32k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|Doubao-lite-128k|240828|长文本处理|128k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|240515|长文本处理|128k|4k|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|

## Moonshot

教程：[文本生成](https://www.volcengine.com/docs/82379/1399009) **|** API：[ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)  
Moonshot-v1 是由 Moonshot AI 推出的千亿参数的语言模型，具备优秀的语义理解、指令遵循和文本生成能力。Moonshot-v1 有8K、32K、128K 三种上下文长度的模型。

|**模型名称**|**版本**|**模型领域**|**最大上下文长度**  <br>(token)|**最大输出长度**  <br>(token)|**免费额度**  <br>（token）|**定价**  <br>(元/千 token)|
|---|---|---|---|---|---|---|
|moonshot-v1-8k|v1|通用任务|8k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|moonshot-v1-32k|v1|通用任务|32k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|moonshot-v1-128k|v1|通用任务|128k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|

## GLM

教程：[文本生成](https://www.volcengine.com/docs/82379/1399009) **|** API：[ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)  
GLM3-130B 是智谱AI发布大型预训练语言模型。GLM3-130B 模型的名称中的 “130B” 表示该模型拥有 1300 亿个参数。

|**模型名称**|**版本**|**模型领域**|**最大上下文长度**  <br>(token)|**最大输出长度**  <br>(token)|**免费额度**  <br>（token）|**定价**  <br>(元/千 token)|
|---|---|---|---|---|---|---|
|chatglm3-130b-fc|v1.0|通用任务|8k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|chatglm3-130-fin|v1.0-update|金融领域|8k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|

## Mistral

教程：[文本生成](https://www.volcengine.com/docs/82379/1399009) **|** API：[ChatCompletions-文本生成](https://www.volcengine.com/docs/82379/1298454)  
Mistral-7B 是 Mistral 在 3 月 25 日公开发布的大语言模型，擅长语言理解、生成、翻译等任务。大量的训练数据增强了模型的性能和泛化能力，显著降低错误率、改善响应一致性并提高模型回复的准确性和多样性，大幅提升了推理、代码生成和指令跟随等能力。

|**模型名称**|**版本**|**模型领域**|**最大上下文长度**  <br>(token)|**最大输出长度**  <br>(token)|**免费额度**  <br>（token）|**定价**  <br>(元/千 token)|
|---|---|---|---|---|---|---|
|mistral-7b|instruct-v0.2|通用任务|32k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|

视觉理解

## Doubao-vision

教程：[视觉理解](https://www.volcengine.com/docs/82379/1362931) | API：[ChatCompletions-视觉理解](https://www.volcengine.com/docs/82379/1362913)  
多模态大模型，具备强大的图片理解与推理能力，以及精准的指令理解能力。模型在图像文本信息抽取、基于图像的推理任务上有展现出了强大的性能，能够应用于更复杂、更广泛的视觉问答任务。

|**模型名称**|**版本**|**模型领域**|**最大上下文长度**  <br>(token)|**最大输出长度**  <br>(token)|**免费额度**  <br>（token）|**定价**  <br>(元/千 token)|
|---|---|---|---|---|---|---|
|Doubao-vision-pro-32k|241008|图片理解|32k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|
|Doubao-vision-lite-32k|241015|图片理解|32k|4k|500,000|[定价详情](https://www.volcengine.com/pricing?product=ark_bd&tab=1)|