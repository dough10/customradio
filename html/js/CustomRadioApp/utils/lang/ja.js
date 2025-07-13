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
    <h2>サイト移転のお知らせ</h2>
    <p>来月より、当サイトは下記の新しいURLへ完全移行いたします：</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>今月末までは <strong>${currentURL}</strong> にもアクセス可能ですが、1日以降は自動的に新しいURLへリダイレクトされます。</p>
    <p>ブックマークの更新をお忘れなく！</p>
    <p>今後ともよろしくお願いいたします。</p>
  `
};