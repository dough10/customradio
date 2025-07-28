module.exports = {
  clickDismiss: 'Clique para dispensar',
  
  title: 'criador de radio.txt',
  intro: 'Um site para criar um radio.txt personalizado para uso com ',
  hibyLink: 'players de áudio digital Hiby',
  siteUse: 'Para usar o site',
  step1: 'Filtre estações por nome ou gênero (ex: somafm, hip hop, jazz), depois adicione todas as estações que deseja incluir no seu arquivo radio.txt.',
  step2: 'Quando estiver satisfeito com sua lista, clique em "Download" e salve o arquivo de texto no diretório raiz do armazenamento do seu player Hiby.',
  closeButtonText: 'fechar',

  filterLabel: 'Filtrar por nome ou gênero',
  downloadButtonText: 'baixar',
  volume: 'Volume',

  thanks: 'Se achou este site útil e deseja apoiar sua manutenção, pode fazer uma contribuição. Seu apoio ajuda com hospedagem e desenvolvimento contínuo. Obrigado!',
  securityContact: 'Contato de segurança',

  addStation: 'adicionar estação',
  addCase1: 'A URL deve ser de um servidor Icecast com tipo de conteúdo "audio/mpeg" ou "audio/mp3"',
  addCase2: 'A API obterá as outras informações dos cabeçalhos do stream.',
  stationURL: 'URL da estação',
  addButtonText: 'adicionar',

  stations: 'estações',

  stationExists: 'Estação já existe',
  conTestFailed: error => `Teste de conexão falhou: ${error}`,
  noName: 'Falha ao recuperar o nome da estação',
  stationSaved: id => `Estação salva, ID: ${id}`,
  addFail: error => `Falha ao adicionar estação: ${error}`,

  dupLogged: 'Duplicado registrado',
  dupLogFail: error => `Falha ao registrar erro: ${error}`,

  cspError: error => `Erro ao salvar CSP-Report: ${error}`,

  stationsFail: error => `Erro ao buscar estações: ${error}`,

  errorLog: 'erro registrado',
  errorLogFail: error => `Falha ao registrar erro: ${error}`,

  genresFail: error => `Erro ao obter gêneros: ${error}`
};
