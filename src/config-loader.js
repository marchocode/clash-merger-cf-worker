/**
 * 配置加载器 - 从 KV 数据库加载配置
 */
export class ConfigLoader {
  constructor(kv) {
    this.kv = kv;
    this.token = null;
    this.subs = [];
  }

  /**
   * 从 KV 加载 token
   */
  async loadToken(tokenKey) {
    this.token = await this.kv.get(tokenKey);
    return this.token;
  }

  /**
   * 从 KV 加载订阅列表
   */
  async loadSubs(subsKey) {
    const subsJson = await this.kv.get(subsKey);
    if (subsJson) {
      this.subs = JSON.parse(subsJson);
    }
    return this.subs;
  }

  getToken() {
    return this.token;
  }

  getSubs() {
    return this.subs;
  }
}
