export const ko = {
  stations: count => `${count} 개의 방송국`,
  genreError: '유효하지 않은 입력입니다. 유효한 장르를 입력해주세요.',
  stationsError: error => `방송국을 불러오는 중 오류 발생: ${error}`,

  playing: name => `재생 중: ${name}`,
  homepage: '홈페이지',
  homepageTitle: homepage => `${homepage}으로 이동`, 
  markDup: '중복으로 표시',
  dupTitle: '방송국 중복으로 표시',
  playingError: error => `미디어 재생 중 오류 발생: ${error}`,
  noHome: '홈페이지 없음',
  errorHome: error => `홈페이지를 여는 중 오류 발생: ${error}`,
  invalidStation: `유효하지 않은 방송국 데이터입니다. 스트림을 재생할 수 없습니다.`,
  offline: '연결 끊김: 재연결 시도 중',
  online: '재연결됨: 재생 재시작 시도 중',

  playTitle: '스트림 재생',
  addTitle: '파일에 추가', 
  removeTitle: '파일에서 제거',

  appUpdated: '앱 업데이트됨',
  pressToRefresh: '새로 고치려면 누르세요',

  dismiss: '클릭하여 닫기',
  moving: (newURL, currentURL) => `
    <h2>사이트 이전 안내</h2>
    <p>다음 달부터 저희 웹사이트는 아래의 새 주소로 영구 이전됩니다:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>이번 달 말까지는 <strong>${currentURL}</strong> 도 계속 사용할 수 있습니다. 1일부터는 자동으로 새 주소로 이동됩니다.</p>
    <p>즐겨찾기나 링크를 미리 업데이트해 주세요.</p>
    <p>항상 감사드립니다!</p>
  `
};