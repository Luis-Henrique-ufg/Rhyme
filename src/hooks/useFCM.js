import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { messaging, db } from '../config/firebase';

export function useFCM(user) {
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  useEffect(() => {
    if (!messaging || !user || typeof Notification === 'undefined') return;

    const requestPermissionAndGetToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermissionStatus(permission);

        if (permission === 'granted') {
          // You should add VITE_FIREBASE_VAPID_KEY to your .env file
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          const currentToken = await getToken(messaging, { 
            vapidKey: vapidKey 
          });

          if (currentToken) {
            setFcmToken(currentToken);
            // Save token to user document
            await updateDoc(doc(db, 'students', user.uid), {
              fcmToken: currentToken
            });
            console.log('FCM Token saved for user.');
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    requestPermissionAndGetToken();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      // Optional: show a toast notification here
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(payload.notification?.title || "Aviso do Ônibus", {
            body: payload.notification?.body || "Nova notificação",
            icon: payload.notification?.icon || '/android-chrome-192x192.png'
          });
        } catch (e) {
          console.warn('Could not display system notification:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  return { fcmToken, notificationPermissionStatus };
}
