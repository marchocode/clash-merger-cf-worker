import { ConfigLoader } from './config-loader.js';
import { ProxyProvider } from './proxy-provider.js';
import { ClashMerger } from './clash-merger.js';
import { BASE_CONFIG } from './base-config.js';

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
 * 处理订阅请求
 */
async function handleSubscription(token, kv) {
  // 验证 token
  await tokenCheck(token, kv);

  // 加载配置
  const configLoader = new ConfigLoader(kv);
  await configLoader.loadSubs('SUBS');

  const subs = configLoader.getSubs();
  if (!subs || subs.length === 0) {
    throw new Error('未找到订阅配置');
  }

  // 创建代理提供者
  const providers = subs.map(sub => new ProxyProvider(sub.name, sub.url));

  // 合并配置
  const merger = new ClashMerger(providers, BASE_CONFIG);
  await merger.merge();

  // 返回 YAML
  return merger.dump();
}

/**
 * Worker 主入口
 */
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 路由: /subs/<token>
      const match = path.match(/^\/subs\/([^\/]+)$/);
      if (!match) {
        return new Response('Not Found', { status: 404 });
      }

      const token = match[1];
      const yamlContent = await handleSubscription(token, env.CLASH_KV);

      return new Response(yamlContent, {
        headers: {
          'Content-Type': 'application/x-yaml; charset=utf-8',
        },
      });

    } catch (error) {
      console.error('处理失败:', error);
      return new Response(`处理失败: ${error.message}`, { status: 500 });
    }
  },
};
