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
    <h2>알림! 저희 웹사이트가 새로운 주소로 이동합니다!</h2>
    <p>저희는 새로운 웹 주소로 전환하고 있습니다:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>제한된 기간 동안 ${currentURL}과 새 URL 모두 완벽하게 접속 가능합니다. 새로운 주소를 사용하시고 저장된 링크를 업데이트하시기를 권장합니다.</p>
    <p>이 전환 기간 동안 기다려 주셔서 감사합니다!</p>
  `
};