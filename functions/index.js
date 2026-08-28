const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

exports.checkBusDistanceAndNotify = onDocumentUpdated("trips/{tripId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  // Se não tem localização do ônibus ou ela não mudou, ignorar
  if (
    !afterData.busLocation ||
    !afterData.busLocation.lat ||
    !afterData.busLocation.lng
  ) {
    return;
  }

  if (
    beforeData.busLocation &&
    beforeData.busLocation.lat === afterData.busLocation.lat &&
    beforeData.busLocation.lng === afterData.busLocation.lng
  ) {
    return;
  }

  const tripId = event.params.tripId;
  const busLat = afterData.busLocation.lat;
  const busLng = afterData.busLocation.lng;

  // Carregar todos os attendances dessa trip
  const db = admin.firestore();
  const attendancesSnapshot = await db
    .collection("attendance")
    .where("tripId", "==", tripId)
    .where("status", "==", "liberado")
    .get();

  if (attendancesSnapshot.empty) {
    return;
  }

  const notifiedStudents = afterData.notifiedStudents || [];
  let studentsToNotify = [];
  let updatedNotifiedList = [...notifiedStudents];

  attendancesSnapshot.forEach((doc) => {
    const attendance = doc.data();
    if (attendance.studentId && attendance.lat && attendance.lng) {
      if (!notifiedStudents.includes(attendance.studentId)) {
        const distance = getDistanceFromLatLonInKm(
          busLat,
          busLng,
          attendance.lat,
          attendance.lng
        );

        if (distance <= 1.0) { // 1 km
          studentsToNotify.push(attendance.studentId);
          updatedNotifiedList.push(attendance.studentId);
        }
      }
    }
  });

  if (studentsToNotify.length === 0) {
    return;
  }

  console.log(`Sending notifications to ${studentsToNotify.length} students.`);

  // Update notifiedStudents to prevent spam
  await db.collection("trips").doc(tripId).update({
    notifiedStudents: updatedNotifiedList,
  });

  // Fetch FCM tokens and send notifications
  for (const studentId of studentsToNotify) {
    try {
      const studentDoc = await db.collection("students").doc(studentId).get();
      if (studentDoc.exists) {
        const fcmToken = studentDoc.data().fcmToken;
        if (fcmToken) {
          const message = {
            notification: {
              title: "O ônibus está chegando!",
              body: "O ônibus está a menos de 1 km da sua localização atual.",
            },
            token: fcmToken,
            webpush: {
              notification: {
                icon: "/icon-192x192.png",
                vibrate: [200, 100, 200, 100, 200],
              }
            }
          };
          await admin.messaging().send(message);
          console.log(`Notification sent to student ${studentId}`);
        }
      }
    } catch (err) {
      console.error(`Error sending notification to student ${studentId}:`, err);
    }
  }
});
