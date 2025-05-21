export const ja = {
  stations: count => `${count} 局`,
  genreError: '無効な入力です。有効なジャンルを入力してください。',
  stationsError: error => `放送局の取得中にエラーが発生しました: ${error}`,

  playing: name => `再生中: ${name}`,
  homepage: 'ホームページ',
  homepageTitle: homepage => `${homepage}へ移動`, 
  markDup: '重複としてマーク',
  dupTitle: '放送局を重複としてマーク',
  playingError: error => `メディアの再生中にエラーが発生しました: ${error}`,
  noHome: 'ホームページなし',
  errorHome: error => `ホームページを開く中にエラーが発生しました: ${error}`,
  invalidStation: `無効な放送局データです。ストリームを再生できません。`,
  offline: '切断されました: 再接続を試みています',
  online: '再接続されました: 再生を再開しようとしています',

  playTitle: 'ストリームを再生',
  addTitle: 'ファイルに追加', 
  removeTitle: 'ファイルから削除',

  appUpdated: 'アプリが更新されました',
  pressToRefresh: 'タップして更新',

  dismiss: 'クリックして閉じる',
  moving: (newURL, currentURL) => `
    <h2>お知らせ！ウェブサイトが新しいURLに移行します！</h2>
    <p>新しいウェブアドレスに移行しています:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>期間限定で、現在の${currentURL}と新しいURLの両方にアクセスできます。新しいアドレスの使用を開始し、保存されているリンクを更新することをお勧めします。</p>
    <p>この移行期間中の皆様のご理解とご協力に感謝いたします！</p>
  `
};