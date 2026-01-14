import yaml from 'js-yaml';

/**
 * 代理提供者 - 从远程 URL 获取订阅配置
 */
export class ProxyProvider {
  constructor(name, url) {
    this.name = name;
    this.url = url;
    this.proxies = [];
  }

  /**
   * 获取订阅内容
   */
  async fetchProxies() {
    const startTime = Date.now();
    try {
      console.log(JSON.stringify({
        level: 'INFO',
        message: '开始获取订阅',
        provider: this.name,
        url: this.url
      }));

      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'clash-verge/v2.2.3'
        }
      });

      if (!response.ok) {
        console.error(JSON.stringify({
          level: 'ERROR',
          message: '获取订阅失败',
          provider: this.name,
          url: this.url,
          status: response.status,
          duration_ms: Date.now() - startTime
        }));
        return;
      }

      const text = await response.text();
      const config = yaml.load(text);
      this.proxies = config.proxies || [];

      console.log(JSON.stringify({
        level: 'INFO',
        message: '订阅获取成功',
        provider: this.name,
        proxy_count: this.proxies.length,
        duration_ms: Date.now() - startTime
      }));

    } catch (error) {
      console.error(JSON.stringify({
        level: 'ERROR',
        message: '获取订阅异常',
        provider: this.name,
        error: error.message,
        duration_ms: Date.now() - startTime
      }));
    }
  }

  getProxies() {
    return this.proxies;
  }

  getName() {
    return this.name;
  }
}
