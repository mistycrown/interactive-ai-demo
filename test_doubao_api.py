import requests
import json

url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 47418a3c-6816-498f-a511-2699c5562137"
}
data = {
    "model": "ep-20250103160403-qgv7p",
    "messages": [
        {
            "role": "user",
            "content": "你好"
        }
    ]
}

response = requests.post(url, headers=headers, json=data)
print(f"Status Code: {response.status_code}")
print(f"Response Headers: {json.dumps(dict(response.headers), indent=2)}")
print(f"Response Body: {json.dumps(response.json(), indent=2, ensure_ascii=False)}") 