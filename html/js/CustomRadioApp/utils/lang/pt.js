export const pt = {
  stations: (count) => `${count} estações`,
  genreError: 'Entrada inválida. Por favor, insira um gênero válido.',
  stationsError: error => `Erro ao buscar estações: ${error}`,

  playing: name => `Reproduzindo: ${name}`,
  homepage: 'página inicial',
  homepageTitle: homepage => `navegar para ${homepage}`, 
  markDup: 'marcar como duplicado',
  dupTitle: 'marcar estação como duplicada',
  playingError: error => `Erro ao reproduzir mídia: ${error}`,
  noHome: 'Sem página inicial',
  errorHome: error => `Erro ao abrir página inicial: ${error}`,
  invalidStation: `Dados da estação inválidos. Não é possível reproduzir o stream.`,
  offline: 'Desconectado: tentando reconectar',
  online: 'Reconectado: tentando reiniciar reprodução',

  playTitle: 'Reproduzir stream',
  addTitle: 'Adicionar ao arquivo', 
  removeTitle: 'Remover do arquivo',

  appUpdated: 'Aplicação atualizada',
  pressToRefresh: 'Clique para atualizar',

  dismiss: 'Clique para dispensar',
  moving: (newURL, currentURL) => `
    <h2>Estamos Mudando — Anote o Novo Endereço!</h2>
    <p>A partir do próximo mês, nosso site estará oficialmente em um novo endereço permanente:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Até o final deste mês, você ainda poderá acessar o site em <strong>${currentURL}</strong>, mas após o dia 1º, todas as visitas serão redirecionadas automaticamente para o novo URL.</p>
    <p>Para evitar interrupções, recomendamos atualizar seus favoritos e links salvos agora.</p>
    <p>Estamos animados com a mudança e agradecemos por vir conosco!</p>
  `
};
