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
    try {
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'clash-verge/v2.2.3'
        }
      });

      if (!response.ok) {
        console.error(`获取订阅失败: ${this.url}, 状态码: ${response.status}`);
        return;
      }

      const text = await response.text();
      const config = yaml.load(text);
      this.proxies = config.proxies || [];

    } catch (error) {
      console.error(`获取订阅失败: ${error.message}`);
    }
  }

  getProxies() {
    return this.proxies;
  }

  getName() {
    return this.name;
  }
}
