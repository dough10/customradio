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
  pressToRefresh: 'Appuyez pour actualiser',

  dismiss: 'Cliquer pour ignorer',
  moving: (newURL, currentURL) => `
    <h2>On déménage — à noter !</h2>
    <p>Dès le mois prochain, notre site sera disponible à une nouvelle adresse permanente :</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Jusqu’à la fin du mois, vous pouvez encore utiliser <strong>${currentURL}</strong>. Après le 1er, vous serez redirigé automatiquement.</p>
    <p>Pensez à mettre à jour vos favoris dès maintenant.</p>
    <p>Merci de faire ce changement avec nous !</p>
  `
};