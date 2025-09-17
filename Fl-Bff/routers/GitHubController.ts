import { route, GET } from 'awilix-koa';
import type Router from 'koa-router';
import axios from 'axios';

@route('/api/github')
class GitHubController {
  // 获取GitHub用户信息
  @route('/user')
  @GET()
  async getGitHubUser(ctx: Router.IRouterContext) {
    try {
      const authorization = ctx.headers.authorization;
      
      if (!authorization) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '缺少Authorization头'
        };
        return;
      }

      // 提取token
      const token = authorization.replace('Bearer ', '');
      
      if (!token) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '无效的token格式'
        };
        return;
      }

      // 调用GitHub API
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'Fl-Bff-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000 // 10秒超时
      });

      ctx.body = {
        success: true,
        data: response.data,
        message: '获取GitHub用户信息成功'
      };
    } catch (error: any) {
      console.error('获取GitHub用户信息失败:', error.message);
      
      if (error.response) {
        // GitHub API返回的错误
        const status = error.response.status;
        const message = error.response.data?.message || '未知错误';
        
        ctx.status = status;
        ctx.body = {
          success: false,
          message: `GitHub API错误: ${message}`,
          error: {
            status,
            message
          }
        };
      } else if (error.code === 'ECONNABORTED') {
        // 超时错误
        ctx.status = 408;
        ctx.body = {
          success: false,
          message: '请求超时，请检查网络连接'
        };
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // 网络连接错误
        ctx.status = 503;
        ctx.body = {
          success: false,
          message: '无法连接到GitHub API，请检查网络连接'
        };
      } else {
        // 其他错误
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: '服务器内部错误',
          error: error.message
        };
      }
    }
  }

  // 获取GitHub用户的仓库列表
  @route('/repos')
  @GET()
  async getGitHubRepos(ctx: Router.IRouterContext) {
    try {
      const authorization = ctx.headers.authorization;
      
      if (!authorization) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '缺少Authorization头'
        };
        return;
      }

      const token = authorization.replace('Bearer ', '');
      
      if (!token) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '无效的token格式'
        };
        return;
      }

      // 获取查询参数
      const { page = 1, per_page = 30, sort = 'updated', direction = 'desc' } = ctx.query;

      // 调用GitHub API获取仓库列表
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'Fl-Bff-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          page,
          per_page,
          sort,
          direction
        },
        timeout: 10000
      });

      ctx.body = {
        success: true,
        data: response.data,
        message: '获取GitHub仓库列表成功'
      };
    } catch (error: any) {
      console.error('获取GitHub仓库列表失败:', error.message);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || '未知错误';
        
        ctx.status = status;
        ctx.body = {
          success: false,
          message: `GitHub API错误: ${message}`,
          error: {
            status,
            message
          }
        };
      } else if (error.code === 'ECONNABORTED') {
        ctx.status = 408;
        ctx.body = {
          success: false,
          message: '请求超时，请检查网络连接'
        };
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        ctx.status = 503;
        ctx.body = {
          success: false,
          message: '无法连接到GitHub API，请检查网络连接'
        };
      } else {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: '服务器内部错误',
          error: error.message
        };
      }
    }
  }
}

export default GitHubController;