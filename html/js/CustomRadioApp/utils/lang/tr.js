export const tr = {
  stations: (count) => `${count} istasyon`,
  genreError: 'Geçersiz giriş. Lütfen geçerli bir tür girin.',
  stationsError: error => `İstasyonlar alınırken hata oluştu: ${error}`,

  playing: name => `Çalıyor: ${name}`,
  homepage: 'anasayfa',
  homepageTitle: homepage => `${homepage} adresine git`, 
  markDup: 'çift kaydı işaretle',
  dupTitle: 'istasyonu kopya olarak işaretle',
  playingError: error => `Medya oynatılırken hata oluştu: ${error}`,
  noHome: 'Anasayfa yok',
  errorHome: error => `Anasayfa açılırken hata oluştu: ${error}`,
  invalidStation: `Geçersiz istasyon verisi. Akış oynatılamıyor.`,
  offline: 'Bağlantı kesildi: yeniden bağlanılıyor',
  online: 'Yeniden bağlandı: oynatma yeniden başlatılıyor',

  playTitle: 'Akışı oynat',
  addTitle: 'Dosyaya ekle', 
  removeTitle: 'Dosyadan kaldır',

  appUpdated: 'Uygulama güncellendi',
  pressToRefresh: 'Yenilemek için tıklayın',

  dismiss: 'Kapatmak için tıklayın',
  moving: (newURL, currentURL) => `
    <h2>Taşınıyoruz — Lütfen Not Edin!</h2>
    <p>Gelecek aydan itibaren web sitemiz kalıcı olarak yeni adresinde olacak:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Bu ayın sonuna kadar <strong>${currentURL}</strong> adresinden erişim sağlanabilecek, ancak 1'inden sonra tüm ziyaretler otomatik olarak yeni adrese yönlendirilecektir.</p>
    <p>Aksaklık yaşamamak için yer imlerinizi ve kayıtlı bağlantılarınızı şimdi güncellemenizi öneriyoruz.</p>
    <p>Bu değişiklikten heyecan duyuyoruz ve bizimle olduğunuz için teşekkür ederiz!</p>
  `
};
