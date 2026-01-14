import { ConfigLoader } from './config-loader.js';
import { ProxyProvider } from './proxy-provider.js';
import { ClashMerger } from './clash-merger.js';
import { BASE_CONFIG } from './base-config.js';
import { Logger } from './logger.js';
import loginHtml from './login.html';
import adminHtml from './admin.html';

/**
 * Token 验证
 */
async function tokenCheck(token, kv) {
  const validToken = await kv.get('TOKEN');
  if (!validToken || token !== validToken) {
    throw new Error('Invalid token');
  }
}

/**
 * 验证请求中的 Authorization 头
 */
async function verifyAuth(request, kv) {
  const authToken = request.headers.get('Authorization');
  if (!authToken) {
    return false;
  }

  const validToken = await kv.get('TOKEN');
  return authToken === validToken;
}

/**
 * 返回 JSON 响应
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * 返回 HTML 响应
 */
function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

/**
 * 处理登录请求
 */
async function handleLogin(request, kv, logger) {
  const body = await request.json();
  const { token } = body;

  logger.info('登录请求', { token_length: token?.length });

  const validToken = await kv.get('TOKEN');
  if (token === validToken) {
    logger.info('登录成功');
    return jsonResponse({ success: true, message: '登录成功' });
  } else {
    logger.warn('登录失败：令牌无效');
    return jsonResponse({ success: false, error: '令牌无效' }, 401);
  }
}

/**
 * 处理获取订阅列表请求
 */
async function handleGetSubs(request, kv, logger) {
  const isAuthed = await verifyAuth(request, kv);
  if (!isAuthed) {
    logger.warn('获取订阅列表失败：未授权');
    return jsonResponse({ error: '未授权' }, 401);
  }

  const subsJson = await kv.get('SUBS');
  const subs = subsJson ? JSON.parse(subsJson) : [];

  logger.info('获取订阅列表成功', { count: subs.length });
  return jsonResponse({ subs });
}

/**
 * 处理更新订阅列表请求
 */
async function handleUpdateSubs(request, kv, logger) {
  const isAuthed = await verifyAuth(request, kv);
  if (!isAuthed) {
    logger.warn('更新订阅列表失败：未授权');
    return jsonResponse({ error: '未授权' }, 401);
  }

  const body = await request.json();
  const { subs } = body;

  logger.info('更新订阅列表', { count: subs.length });
  await kv.put('SUBS', JSON.stringify(subs));

  logger.info('订阅列表保存成功');
  return jsonResponse({ success: true, message: '保存成功' });
}

/**
 * 处理订阅请求
 */
async function handleSubscription(token, kv, logger) {
  // 验证 token
  logger.info('订阅请求', { token_prefix: token.substring(0, 8) + '...' });
  await tokenCheck(token, kv);

  // 加载配置
  const configLoader = new ConfigLoader(kv);
  await configLoader.loadSubs('SUBS');

  const subs = configLoader.getSubs();
  if (!subs || subs.length === 0) {
    logger.error('未找到订阅配置');
    throw new Error('未找到订阅配置');
  }

  logger.info('开始合并订阅', { sources: subs.length });

  // 创建代理提供者
  const providers = subs.map(sub => new ProxyProvider(sub.name, sub.url));

  // 合并配置
  const merger = new ClashMerger(providers, BASE_CONFIG);
  await merger.merge();

  logger.info('订阅合并完成');

  // 返回 YAML
  return merger.dump();
}

/**
 * Worker 主入口
 */
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 创建日志记录器
    const logger = new Logger({
      request_id: crypto.randomUUID(),
      method,
      path,
      user_agent: request.headers.get('User-Agent'),
      cf_ray: request.headers.get('CF-Ray'),
      cf_country: request.cf?.country,
      cf_colo: request.cf?.colo
    });

    logger.info('请求开始');

    try {
      let response;

      // 路由: 健康检查
      if (path === '/health') {
        logger.info('健康检查');
        response = jsonResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      }
      // 路由: 登录页面
      else if (path === '/login' || path === '/') {
        logger.info('返回登录页面');
        response = htmlResponse(loginHtml);
      }
      // 路由: 管理页面
      else if (path === '/admin') {
        logger.info('返回管理页面');
        response = htmlResponse(adminHtml);
      }
      // 路由: 登录 API
      else if (path === '/api/login' && method === 'POST') {
        response = await handleLogin(request, env.CLASH_KV, logger);
      }
      // 路由: 获取订阅列表 API
      else if (path === '/api/subs' && method === 'GET') {
        response = await handleGetSubs(request, env.CLASH_KV, logger);
      }
      // 路由: 更新订阅列表 API
      else if (path === '/api/subs' && method === 'PUT') {
        response = await handleUpdateSubs(request, env.CLASH_KV, logger);
      }
      // 路由: /subs/<token>
      else {
        const match = path.match(/^\/subs\/([^\/]+)$/);
        if (match) {
          const token = match[1];
          const yamlContent = await handleSubscription(token, env.CLASH_KV, logger);

          response = new Response(yamlContent, {
            headers: {
              'Content-Type': 'application/x-yaml; charset=utf-8',
            },
          });
        } else {
          logger.warn('路由未找到');
          response = new Response('Not Found', { status: 404 });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('请求完成', {
        status: response.status,
        duration_ms: duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('请求失败', {
        error: error.message,
        stack: error.stack,
        duration_ms: duration
      });

      return new Response(`处理失败: ${error.message}`, { status: 500 });
    }
  },
};
