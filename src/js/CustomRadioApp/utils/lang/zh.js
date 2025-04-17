export const zh = {
  stations: count => `${count} 个电台`,
  genreError: '输入无效。请输入有效的类别。',
  stationsError: error => `获取电台时出错：${error}`,

  playing: name => `正在播放：${name}`,
  homepage: '主页',
  homepageTitle: homepage => `跳转到 ${homepage}`, 
  markDup: '标记为重复',
  dupTitle: '标记电台为重复',
  playingError: error => `播放媒体时出错：${error}`,
  noHome: '没有主页',
  errorHome: error => `打开主页时出错：${error}`,
  invalidStation: `电台数据无效，无法播放流媒体。`,
  offline: '已断开连接：正在尝试重新连接',
  online: '已重新连接：正在尝试重新播放',

  playTitle: '播放流媒体',
  addTitle: '添加到文件', 
  removeTitle: '从文件中移除',

  appUpdated: '应用已更新',
  pressToRefresh: '点击刷新'
};
