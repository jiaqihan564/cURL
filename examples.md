# cURL 命令示例

以下是一些常用的 cURL 命令示例，可以复制这些命令到 cURL 测试工具中进行测试。

## 基本 GET 请求

```
curl https://jsonplaceholder.typicode.com/posts/1
```

## 指定请求方法

```
curl -X GET https://jsonplaceholder.typicode.com/posts/1
```

## 带请求头的 GET 请求

```
curl -X GET -H "Accept: application/json" https://jsonplaceholder.typicode.com/posts/1
```

## 基本 POST 请求

```
curl -X POST -H "Content-Type: application/json" -d '{"title":"foo","body":"bar","userId":1}' https://jsonplaceholder.typicode.com/posts
```

## 使用表单数据的 POST 请求

```
curl -X POST -d "title=foo&body=bar&userId=1" https://jsonplaceholder.typicode.com/posts
```

## PUT 请求

```
curl -X PUT -H "Content-Type: application/json" -d '{"id":1,"title":"foo","body":"bar","userId":1}' https://jsonplaceholder.typicode.com/posts/1
```

## DELETE 请求

```
curl -X DELETE https://jsonplaceholder.typicode.com/posts/1
```

## 带认证的请求

```
curl -X GET -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/data
```

## 带查询参数的请求

```
curl -X GET https://jsonplaceholder.typicode.com/posts?userId=1
```

## 上传文件

```
curl -X POST -F "file=@/path/to/file.txt" https://example.com/upload
```

## 下载文件

```
curl -X GET -O https://example.com/file.zip
```

## 跟随重定向

```
curl -L https://example.com/redirect
```

## 显示详细信息

```
curl -v https://jsonplaceholder.typicode.com/posts/1
```

## 设置超时

```
curl --connect-timeout 10 https://example.com/api
```

## 使用代理

```
curl -x http://proxy.example.com:8080 https://target.example.com/api
```

## 忽略 SSL 证书验证

```
curl -k https://example.com/api
```

## 使用 HTTP/2

```
curl --http2 https://example.com/api
```

## 使用特定的 HTTP 版本

```
curl --http1.1 https://example.com/api
```

## 设置 Cookie

```
curl -b "name=value" https://example.com/api
```

## 保存 Cookie

```
curl -c cookies.txt https://example.com/login
```

## 使用 JSON 数据

```
curl --json '{"name":"John","age":30}' https://example.com/api/users
```

## 使用 GraphQL 查询

```
curl -X POST -H "Content-Type: application/json" -d '{"query":"{\n  user(id: \"1\") {\n    name\n    email\n  }\n}"}' https://api.example.com/graphql
```

## 使用 Basic 认证

```
curl -u username:password https://api.example.com/protected
```

## 使用 Digest 认证

```
curl --digest -u username:password https://api.example.com/protected
```

## 使用 OAuth 2.0 认证

```
curl -H "Authorization: Bearer ACCESS_TOKEN" https://api.example.com/resource
```

## 使用自定义请求方法

```
curl -X PATCH -H "Content-Type: application/json" -d '{"completed":true}' https://jsonplaceholder.typicode.com/todos/1
```

## 多部分表单数据

```
curl -X POST -F "name=John" -F "avatar=@/path/to/image.jpg" https://example.com/upload
```

## 设置 Referer

```
curl -e "https://example.com" https://api.example.com/data
```

## 设置 User-Agent

```
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" https://example.com
```