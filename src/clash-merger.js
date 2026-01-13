import yaml from 'js-yaml';

/**
 * Clash 配置合并器
 */
export class ClashMerger {
  constructor(providers, baseConfig) {
    this.providers = providers;
    this.baseConfig = baseConfig;
    this.config = {};
    this.proxies = [];
    this.proxyGroups = [];
  }

  /**
   * 合并所有订阅配置
   */
  async merge() {
    // 加载基础配置
    this.config = JSON.parse(JSON.stringify(this.baseConfig));

    // 获取所有订阅的代理
    for (const provider of this.providers) {
      await provider.fetchProxies();

      const proxies = provider.getProxies();
      if (proxies.length === 0) {
        continue;
      }

      // 添加代理到总列表
      this.proxies.push(...proxies);

      // 为每个订阅创建一个选择组
      this.processGroup(provider);
    }

    // 创建 AUTO 自动选择组
    this.processAutoGroup();

    // 创建 PROXY 主代理组
    this.processProxyGroup();

    // 更新配置
    this.config.proxies = this.proxies;
    this.config['proxy-groups'] = this.proxyGroups;
  }

  /**
   * 创建 AUTO 自动选择组
   */
  processAutoGroup() {
    const auto = {
      name: 'AUTO',
      type: 'url-test',
      proxies: [],
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    };

    for (const proxy of this.proxies) {
      auto.proxies.push(proxy.name);
    }

    this.proxyGroups.push(auto);
  }

  /**
   * 创建 PROXY 主代理组
   */
  processProxyGroup() {
    const proxy = {
      name: 'PROXY',
      type: 'select',
      proxies: []
    };

    for (const group of this.proxyGroups) {
      proxy.proxies.push(group.name);
    }

    this.proxyGroups.unshift(proxy);
  }

  /**
   * 为每个订阅创建选择组
   */
  processGroup(provider) {
    const group = {
      name: provider.getName(),
      type: 'select',
      proxies: []
    };

    for (const proxy of provider.getProxies()) {
      group.proxies.push(proxy.name);
    }

    this.proxyGroups.push(group);
  }

  /**
   * 导出为 YAML 字符串
   */
  dump() {
    return yaml.dump(this.config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  }
}
