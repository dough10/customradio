module.exports = {
  clickDismiss: 'クリックして閉じる',
  
  title: 'radio.txt 作成ツール',
  intro: 'カスタム radio.txt を作成するためのウェブサイトで、',
  hibyLink: 'Hibyデジタルオーディオプレーヤー',
  siteUse: 'サイトの使い方',
  step1: '放送局を名前やジャンル（例：somafm、ヒップホップ、ジャズ）で絞り込み、radio.txt ファイルに含めたいすべての放送局を追加します。',
  step2: 'リストに満足したら、「ダウンロード」を押し、Hibyプレーヤーのストレージのルートディレクトリにテキストファイルを保存します。',
  closeButtonText: '閉じる',

  filterLabel: '名前またはジャンルで絞り込む',
  downloadButtonText: 'ダウンロード',
  volume: '音量',

  thanks: 'このサイトが役立つと感じ、運営をサポートしたい場合は、寄付をすることができます。皆様のサポートは、ホスティングと継続的な開発に役立ちます。ありがとうございます！',
  securityContact: 'セキュリティ連絡先',

  addStation: '放送局を追加',
  addCase1: 'URLは、コンテンツタイプが「audio/mpeg」または「audio/mp3」のIcecastサーバーである必要があります',
  addCase2: 'APIがストリームヘッダーから他の情報を取得します。',
  stationURL: '放送局URL',
  addButtonText: '追加',

  stations: '放送局',

  stationExists: '放送局は既に存在します',
  conTestFailed: error => `接続テストに失敗しました: ${error}`,
  noName: '放送局名の取得に失敗しました',
  stationSaved: id => `放送局が保存されました、ID: ${id}`,
  addFail: error => `放送局の追加に失敗しました: ${error}`,

  dupLogged: '重複が記録されました',
  dupLogFail: error => `エラーの記録に失敗しました: ${error}`,

  cspError: error => `CSPレポートの保存中にエラーが発生しました: ${error}`,

  stationsFail: error => `放送局の取得中にエラーが発生しました: ${error}`,

  errorLog: 'エラーが記録されました',
  errorLogFail: error => `エラーの記録に失敗しました: ${error}`,

  genresFail: error => `ジャンルの取得中にエラーが発生しました: ${error}`
};