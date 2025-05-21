module.exports = {
  clickDismiss: '클릭하여 닫기',
  
  title: 'radio.txt 생성기',
  intro: '사용자 지정 radio.txt 파일을 생성하는 웹사이트로, ',
  hibyLink: 'Hiby 디지털 오디오 플레이어',
  siteUse: '사이트 사용법',
  step1: '방송국을 이름 또는 장르(예: somafm, 힙합, 재즈)로 필터링한 다음, radio.txt 파일에 포함하고 싶은 모든 방송국을 추가하세요.',
  step2: '목록이 마음에 들면 "다운로드"를 누르고, Hiby 플레이어 저장소의 루트 디렉토리에 텍스트 파일을 저장하세요.',
  closeButtonText: '닫기',

  filterLabel: '이름 또는 장르로 필터링',
  downloadButtonText: '다운로드',
  volume: '볼륨',

  thanks: '이 사이트가 유용하다고 생각하시고 운영을 지원하고 싶으시면 기부하실 수 있습니다. 여러분의 지원은 호스팅 및 지속적인 개발에 도움이 됩니다. 감사합니다!',
  securityContact: '보안 문의',

  addStation: '방송국 추가',
  addCase1: 'URL은 콘텐츠 유형이 "audio/mpeg" 또는 "audio/mp3"인 Icecast 서버여야 합니다',
  addCase2: 'API가 스트림 헤더에서 다른 정보를 가져올 것입니다.',
  stationURL: '방송국 URL',
  addButtonText: '추가',

  stations: '방송국',

  stationExists: '방송국이 이미 존재합니다',
  conTestFailed: error => `연결 테스트 실패: ${error}`,
  noName: '방송국 이름을 가져오지 못했습니다',
  stationSaved: id => `방송국 저장됨, ID: ${id}`,
  addFail: error => `방송국 추가 실패: ${error}`,

  dupLogged: '중복이 기록되었습니다',
  dupLogFail: error => `오류 기록 실패: ${error}`,

  cspError: error => `CSP-보고서 저장 중 오류 발생: ${error}`,

  stationsFail: error => `방송국을 가져오는 중 오류 발생: ${error}`,

  errorLog: '오류 기록됨',
  errorLogFail: error => `오류 기록 실패: ${error}`,

  genresFail: error => `장르를 가져오는 중 오류 발생: ${error}`
};