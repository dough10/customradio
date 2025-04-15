export const fr = {
  stations: count => `${count} stations`,
  genreError: 'Entrée invalide. Veuillez saisir un genre valide.',
  stationsError: error => `Erreur lors de la récupération des stations : ${error}`,

  playing: name => `Lecture : ${name}`,
  homepage: 'page d’accueil',
  homepageTitle: homepage => `naviguer vers ${homepage}`, 
  markDup: 'marquer comme doublon',
  dupTitle: 'marquer la station comme doublon',
  playingError: error => `Erreur de lecture : ${error}`,
  noHome: 'Pas de page d’accueil',
  errorHome: error => `Erreur lors de l’ouverture de la page d’accueil : ${error}`,
  invalidStation: `Données de la station invalides. Impossible de lire le flux.`,
  offline: 'Déconnecté : tentative de reconnexion',
  online: 'Reconnecté : tentative de relancer la lecture',

  playTitle: 'Lire le flux',
  addTitle: 'Ajouter au fichier', 
  removeTitle: 'Supprimer du fichier',

  appUpdated: 'Application mise à jour',
  pressToRefresh: 'Appuyez pour actualiser'
};
