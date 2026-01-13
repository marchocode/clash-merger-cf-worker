/**
 * Clash 基础配置
 * 从原 base.yaml 转换而来
 */
export const BASE_CONFIG = {
  mode: 'rule',
  'mixed-port': 7897,
  'allow-lan': false,
  'log-level': 'info',
  ipv6: false,
  'external-controller': '127.0.0.1:9097',
  secret: 'asdfasdfg',
  'unified-delay': true,
  tun: {
    enable: false,
    stack: 'gvisor',
    'auto-route': true,
    'strict-route': false,
    'auto-detect-interface': true,
    'dns-hijack': ['any:53']
  },
  dns: {
    'default-nameserver': ['223.6.6.6', '8.8.8.8'],
    'direct-nameserver-follow-policy': false,
    enable: true,
    'enhanced-mode': 'fake-ip',
    'fake-ip-filter': [
      '*.lan',
      '*.local',
      '*.arpa',
      'time.*.com',
      'ntp.*.com',
      'time.*.com',
      '+.market.xiaomi.com',
      'localhost.ptlogin2.qq.com',
      '*.msftncsi.com',
      'www.msftconnecttest.com'
    ],
    'fake-ip-filter-mode': 'blacklist',
    'fake-ip-range': '198.18.0.1/16',
    fallback: [
      'https://dns.alidns.com/dns-query',
      'https://dns.google/dns-query',
      'https://cloudflare-dns.com/dns-query'
    ],
    'fallback-filter': {
      domain: ['+.google.com', '+.facebook.com', '+.youtube.com'],
      geoip: true,
      'geoip-code': 'CN',
      ipcidr: ['240.0.0.0/4', '0.0.0.0/32']
    },
    listen: ':53',
    nameserver: [
      '8.8.8.8',
      'https://doh.pub/dns-query',
      'https://dns.alidns.com/dns-query'
    ],
    'prefer-h3': false,
    'proxy-server-nameserver': [
      'https://doh.pub/dns-query',
      'https://dns.alidns.com/dns-query'
    ],
    'respect-rules': false,
    'use-hosts': false,
    'use-system-hosts': false
  },
  'external-controller-cors': {
    'allow-private-network': true,
    'allow-origins': ['*']
  },
  'clash-for-android': {
    'append-system-dns': true
  },
  'tcp-concurrent': true,
  'nameserver-policy': {
    'services.googleapis.cn': '1.1.1.1'
  },
  'rule-providers': {
    reject: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      path: './ruleset/reject.yaml',
      interval: 86400
    },
    icloud: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt',
      path: './ruleset/icloud.yaml',
      interval: 86400
    },
    apple: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt',
      path: './ruleset/apple.yaml',
      interval: 86400
    },
    google: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt',
      path: './ruleset/google.yaml',
      interval: 86400
    },
    proxy: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
      path: './ruleset/proxy.yaml',
      interval: 86400
    },
    direct: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
      path: './ruleset/direct.yaml',
      interval: 86400
    },
    private: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt',
      path: './ruleset/private.yaml',
      interval: 86400
    },
    gfw: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt',
      path: './ruleset/gfw.yaml',
      interval: 86400
    },
    'tld-not-cn': {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt',
      path: './ruleset/tld-not-cn.yaml',
      interval: 86400
    },
    telegramcidr: {
      type: 'http',
      behavior: 'ipcidr',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt',
      path: './ruleset/telegramcidr.yaml',
      interval: 86400
    },
    cncidr: {
      type: 'http',
      behavior: 'ipcidr',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt',
      path: './ruleset/cncidr.yaml',
      interval: 86400
    },
    lancidr: {
      type: 'http',
      behavior: 'ipcidr',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt',
      path: './ruleset/lancidr.yaml',
      interval: 86400
    },
    applications: {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt',
      path: './ruleset/applications.yaml',
      interval: 86400
    }
  },
  rules: [
    'RULE-SET,applications,DIRECT',
    'DOMAIN,clash.razord.top,DIRECT',
    'DOMAIN,yacd.haishan.me,DIRECT',
    'RULE-SET,private,DIRECT',
    'RULE-SET,reject,REJECT',
    'RULE-SET,icloud,DIRECT',
    'RULE-SET,apple,DIRECT',
    'RULE-SET,google,PROXY',
    'RULE-SET,proxy,PROXY',
    'RULE-SET,direct,DIRECT',
    'RULE-SET,lancidr,DIRECT',
    'RULE-SET,cncidr,DIRECT',
    'RULE-SET,telegramcidr,PROXY',
    'GEOIP,LAN,DIRECT',
    'GEOIP,CN,DIRECT',
    'MATCH,PROXY'
  ]
};
