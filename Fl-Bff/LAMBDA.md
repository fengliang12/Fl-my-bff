## Lambda 函数运行机制详解

### 当前项目的 Lambda 基础

是的，<mcfile name="lambda.ts" path="d:\FL2025\Fl-My-Bff\Fl-Bff\lambda.ts"></mcfile> 文件确实是这个项目能在 Lambda 函数上运行的基础。这个文件做了三件关键的事情：

```typescript
import serverless from "serverless-http";
import app from "./app";
export const handler = serverless(app);
```

1. **serverless-http 适配器**：将 Koa 应用包装成 Lambda 兼容的处理函数
2. **导入应用实例**：引入完整的 Koa 应用
3. **导出 handler**：Lambda 运行时会调用这个 handler 函数

### Lambda 不会执行 yarn start

**重要概念**：Lambda 函数**不会**执行 `yarn start` 或任何 npm scripts。Lambda 有自己的运行机制：

1. **冷启动**：Lambda 创建新容器时，会加载你的代码包
2. **调用 handler**：每次请求时，Lambda 直接调用导出的 handler 函数
3. **无服务器**：没有传统的服务器启动过程

### 不同项目类型的 Handler 例子

#### 1. **Express.js 项目**

```typescript
// lambda.ts
import serverless from "serverless-http";
import express from "express";

const app = express();
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

export const handler = serverless(app);
```

#### 2. **Next.js 项目**

```typescript
// pages/api/hello.ts
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "Hello from Next.js Lambda" });
}
```

#### 3. **纯 Lambda 函数**

```typescript
// lambda.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from pure Lambda" }),
  };
};
```

#### 4. **NestJS 项目**

```typescript
// lambda.ts
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import serverless from "serverless-http";
import express from "express";

let cachedServer;

export const handler = async (event, context) => {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );
    await nestApp.init();
    cachedServer = serverless(expressApp);
  }
  return cachedServer(event, context);
};
```

### 当前项目的构建流程

根据 <mcfile name="build.js" path="d:\FL2025\Fl-My-Bff\Fl-Bff\build.js"></mcfile> 和 <mcfile name="template-vpc.yaml" path="d:\FL2025\Fl-My-Bff\Fl-Bff\template-vpc.yaml"></mcfile>：

1. **构建阶段**：`tsc` 编译 TypeScript → `dist/` 目录
2. **打包阶段**：SAM 将 `dist/` 目录打包上传
3. **运行阶段**：Lambda 调用 `dist/lambda.handler`

### 关键配置说明

在 <mcfile name="template-vpc.yaml" path="d:\FL2025\Fl-My-Bff\Fl-Bff\template-vpc.yaml"></mcfile> 中：

- `Handler: lambda.handler` - 指定入口函数
- `CodeUri: dist/` - 指定代码目录
- `Runtime: nodejs20.x` - 指定运行时环境

### 总结

每个项目都需要：

1. **适配器层**：将框架应用包装成 Lambda 兼容格式
2. **Handler 函数**：作为 Lambda 的入口点
3. **构建流程**：将源码编译/打包到部署目录
4. **配置文件**：指定 handler 路径和运行时环境

Lambda 的优势是按需执行，无需管理服务器，但需要针对 Serverless 架构进行适配。
