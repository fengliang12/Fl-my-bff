//实现的目的是控制反转 IOC
//用到的方法是DI
import { GET, route } from "awilix-koa";
import { IApi } from "@interfaces/IApi";
import type Router from "koa-router";

//面向切面编程AOP
@route("/api")
class ApiController {
  private apiServices: IApi;
  constructor({ apiServices }: { apiServices: IApi }) {
    this.apiServices = apiServices;
  }
  @route("/list")
  @GET()
  async actionList(ctx: Router.IRouterContext) {
    const data = await this.apiServices.getInfo();
    console.log("data:🍊 ", data);
    ctx.body = {
      data,
    };
  }
}

export default ApiController;
