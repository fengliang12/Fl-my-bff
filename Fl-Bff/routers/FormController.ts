import { route, GET, POST, PUT, DELETE } from "awilix-koa";
import type Router from "koa-router";

@route("/api/form")
class FormController {
  private databaseService: any;

  constructor({ databaseService }: { databaseService: any }) {
    this.databaseService = databaseService;
  }

  // 获取所有表单数据
  @route("")
  @GET()
  async getAllFormData(ctx: Router.IRouterContext) {
    try {
      const data = await this.databaseService.getAllFormData();
      ctx.body = {
        success: true,
        data: data,
        message: "获取数据成功",
      };
    } catch (error) {
      console.error("获取表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取数据失败",
        error: error.message,
      };
    }
  }

  // 根据ID获取表单数据
  @route("/:id")
  @GET()
  async getFormDataById(ctx: Router.IRouterContext) {
    try {
      const id = parseInt(ctx.params.id);
      if (isNaN(id)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "无效的ID参数",
        };
        return;
      }

      const data = await this.databaseService.getFormDataById(id);
      if (data) {
        ctx.body = {
          success: true,
          data: data,
          message: "获取数据成功",
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "数据不存在",
        };
      }
    } catch (error) {
      console.error("获取表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取数据失败",
        error: error.message,
      };
    }
  }

  // 创建表单数据
  @route("")
  @POST()
  async createFormData(ctx: Router.IRouterContext) {
    try {
      const { name, email } = ctx.request.body as any;

      // 验证必填字段
      if (!name || !email) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "姓名和邮箱为必填字段",
        };
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "邮箱格式不正确",
        };
        return;
      }

      const data = await this.databaseService.createFormData({
        name: name.trim(),
        email: email.trim(),
      });
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: data,
        message: "创建成功",
      };
    } catch (error) {
      console.error("创建表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建失败",
        error: error.message,
      };
    }
  }

  // 更新表单数据
  @route("/:id")
  @PUT()
  async updateFormData(ctx: Router.IRouterContext) {
    try {
      const id = parseInt(ctx.params.id);
      if (isNaN(id)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "无效的ID参数",
        };
        return;
      }

      const { name, email } = ctx.request.body as any;

      // 验证必填字段
      if (!name || !email) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "姓名和邮箱为必填字段",
        };
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "邮箱格式不正确",
        };
        return;
      }

      const data = await this.databaseService.updateFormData(id, {
        name: name.trim(),
        email: email.trim(),
      });
      if (data) {
        ctx.body = {
          success: true,
          data: data,
          message: "更新成功",
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "数据不存在",
        };
      }
    } catch (error) {
      console.error("更新表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新失败",
        error: error.message,
      };
    }
  }

  // 删除表单数据
  @route("/:id")
  @DELETE()
  async deleteFormData(ctx: Router.IRouterContext) {
    try {
      const id = parseInt(ctx.params.id);
      if (isNaN(id)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "无效的ID参数",
        };
        return;
      }

      const success = await this.databaseService.deleteFormData(id);
      if (success) {
        ctx.body = {
          success: true,
          message: "删除成功",
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "数据不存在",
        };
      }
    } catch (error) {
      console.error("删除表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除失败",
        error: error.message,
      };
    }
  }
}

module.exports = FormController;
export default FormController;
