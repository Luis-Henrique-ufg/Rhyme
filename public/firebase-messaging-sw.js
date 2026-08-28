importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAlLtLF-epV2Nu_STF82pHsroJ1Un3vEi0",
  authDomain: "track-22dc6.firebaseapp.com",
  projectId: "track-22dc6",
  storageBucket: "track-22dc6.firebasestorage.app",
  messagingSenderId: "326137847508",
  appId: "1:326137847508:web:13a28f0a9d1b14925c6541"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recebeu mensagem em background: ', payload);
  const notificationTitle = payload.notification?.title || "Aviso do Ônibus";
  const notificationOptions = {
    body: payload.notification?.body || "Nova notificação",
    icon: payload.notification?.icon || '/android-chrome-192x192.png',
    vibrate: [200, 100, 200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
