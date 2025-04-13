module.exports = {
  clickDismiss: 'Cliquer pour fermer',

  title: 'Créateur de radio.txt',
  intro: 'Un site web pour créer un fichier radio.txt personnalisé à utiliser avec ',
  hibyLink: 'les lecteurs audio numériques Hiby',
  siteUse: 'Pour utiliser le site',
  step1: 'Filtrez les stations par nom ou genre (ex : somafm, hip hop, jazz), puis ajoutez toutes les stations que vous souhaitez inclure dans votre fichier radio.txt.',
  step2: 'Une fois satisfait de votre liste, cliquez sur "Télécharger" et enregistrez le fichier texte à la racine du stockage de votre lecteur Hiby.',
  closeButtonText: 'fermer',

  filterLabel: 'Filtrer par nom ou genre',
  downloadButtonText: 'télécharger',
  volume: 'Volume',

  thanks: 'Merci d’avoir utilisé le site. Veuillez signaler tout problème de sécurité en utilisant les informations de contact ci-dessous.',
  securityContact: 'Contact sécurité',

  addStation: 'ajouter une station',
  addCase1: 'L’URL doit être un serveur Icecast avec un type de contenu "audio/mpeg" ou "audio/mp3".',
  addCase2: 'L’API récupérera les autres informations depuis les en-têtes du flux.',
  stationURL: 'URL de la station',
  addButtonText: 'ajouter',

  stations: 'stations',

  stationExists: 'La station existe déjà',
  conTestFailed: error => `Échec du test de connexion : ${error}`,
  noName: 'Impossible de récupérer le nom de la station',
  stationSaved: id => `Station enregistrée, ID : ${id}`,
  addFail: error => `Échec de l’ajout de la station : ${error}`,

  dupLogged: 'Doublon enregistré',
  dupLogFail: error => `Erreur lors de l’enregistrement du doublon : ${error}`,

  cspError: error => `Erreur lors de l’enregistrement du rapport CSP : ${error}`,

  stationsFail: error => `Erreur lors de la récupération des stations : ${error}`,

  errorLog: 'erreur enregistrée',
  errorLogFail: error => `Erreur lors de l’enregistrement : ${error}`,

  genresFail: error => `Erreur lors de la récupération des genres : ${error}`
};
