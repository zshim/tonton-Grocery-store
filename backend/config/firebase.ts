import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
// Expects FIREBASE_SERVICE_ACCOUNT to be a stringified JSON of the service account key
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Check if already initialized (prevent duplicate app error in serverless)
    if (admin.apps.length === 0) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin Initialized Successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
} else {
    console.warn('FIREBASE_SERVICE_ACCOUNT not found in env. Notifications will be mocked.');
}

/**
 * Send a push notification to a specific device token
 */
export const sendPushNotification = async (token: string, title: string, body: string) => {
  // If no apps initialized, use mock
  if (admin.apps.length === 0) {
    console.log(`[Mock Notification] To: ${token.substring(0, 10)}... | Title: ${title} | Body: ${body}`);
    return true; // Return success for mock
  }
  
  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      android: {
        priority: 'high',
        notification: {
            sound: 'default'
        }
      },
      apns: {
          payload: {
              aps: {
                  sound: 'default'
              }
          }
      }
    });
    console.log(`Notification sent to ${token.substring(0, 10)}...`);
    return true;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
};