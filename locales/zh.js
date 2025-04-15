module.exports = {
  clickDismiss: '点击关闭',

  title: 'radio.txt 创建器',
  intro: '一个用于创建自定义 radio.txt 文件的网站，适用于 ',
  hibyLink: 'Hiby 数字音频播放器',
  siteUse: '如何使用该网站',
  step1: '按名称或类型筛选电台（例如，somafm、hip hop、jazz），然后添加所有你想要包含在 radio.txt 文件中的电台。',
  step2: '当你对列表满意时，点击“下载”并将文本文件保存到 Hiby 播放器存储的根目录。',
  closeButtonText: '关闭',

  filterLabel: '按名称或类型筛选',
  downloadButtonText: '下载',
  volume: '音量',

  thanks: '如果你觉得这个网站有用并希望支持其维护，可以进行捐助。你的支持帮助我们承担主机费用并继续开发。谢谢！',
  securityContact: '安全联系',

  addStation: '添加电台',
  addCase1: 'URL 应该是一个 Icecast 服务器，内容类型为 "audio/mpeg" 或 "audio/mp3"。',
  addCase2: 'API 将从流的头部获取其他信息。',
  stationURL: '电台 URL',
  addButtonText: '添加',

  stations: '电台',

  stationExists: '电台已存在',
  conTestFailed: error => `连接测试失败：${error}`,
  noName: '无法获取电台名称',
  stationSaved: id => `电台已保存，ID：${id}`,
  addFail: error => `添加电台失败：${error}`,

  dupLogged: '已记录重复项',
  dupLogFail: error => `记录错误失败：${error}`,

  cspError: error => `保存 CSP 报告时出错：${error}`,

  stationsFail: error => `获取电台时出错：${error}`,

  errorLog: '错误已记录',
  errorLogFail: error => `记录错误失败：${error}`,

  genresFail: error => `获取类型时出错：${error}`
};
