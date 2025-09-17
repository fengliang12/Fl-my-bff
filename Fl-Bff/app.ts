import "reflect-metadata";
import * as dotenv from "dotenv";
import { createContainer, Lifetime } from "awilix";
import { loadControllers, scopePerRequest } from "awilix-koa";
import Koa from "koa";

// 加载环境变量
dotenv.config();
import config from "./config";
import render from "koa-swig"; // node的渲染模板
import co from "co";
import serve from "koa-static";
import historyApiFallback from "koa2-connect-history-api-fallback";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import DatabaseService from "./services/DatabaseService";

const container = createContainer();
// 手动注册DatabaseService单例
container.register({
  databaseService: {
    resolve: () => DatabaseService,
    lifetime: Lifetime.SINGLETON,
  },
});

// 加载其他服务（排除DatabaseService）
container.loadModules([`${__dirname}/services/*.js`], {
  formatName: "camelCase",
  resolverOptions: {
    lifetime: Lifetime.SCOPED,
  },
});

const app = new Koa();
const { port, viewDir, memoryFlag, staticDir } = config;

// 添加CORS支持
app.use(
  cors({
    origin: "http://localhost:3000", // React开发服务器地址
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

// 添加JSON解析中间件
app.use(bodyParser());
// 渲染模板
app.context.render = co.wrap(
  render({
    root: viewDir,
    autoescape: true,
    cache: <"memory" | false>memoryFlag,
    writeBody: false,
    ext: "html",
  })
);
//如果遇到用户请求 请求container参与实际的调用
app.use(scopePerRequest(container));

//静态资源生效节点
app.use(serve(staticDir));
app.use(historyApiFallback({ index: "/", whiteList: ["/api"] }));

//让所有的路由全部自动生效
app.use(loadControllers(`${__dirname}/routers/*.js`));

// 启动服务
if (process.env.NODE_ENV !== "production") {
  const serverPort = 3001; // 使用3001端口避免与React冲突
  app.listen(serverPort, () => {
    console.log(`Fl-Bff Server启动成功，端口: ${serverPort}`);
    console.log(`API地址: http://localhost:${serverPort}/api`);
  });
}
export default app;
