import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Initialisation de l’instance Expo
const expo = new Expo();

// Fonction pour envoyer une notification
export async function sendPushNotification(
  pushToken: string,
  message: string
): Promise<void> {
  // Vérifie que le token est valide
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Token de notification invalide : ${pushToken}`);
    return;
  }

  // Crée le message à envoyer
  const messages: ExpoPushMessage[] = [
    {
      to: pushToken,
      sound: 'default',
      body: message,
      data: { withSome: 'data' }, // Vous pouvez personnaliser les données ici
    },
  ];

  try {
    const receipts = await expo.sendPushNotificationsAsync(messages);
    console.log('Notifications envoyées :', receipts);
  } catch (error) {
    console.error('Erreur lors de l’envoi des notifications :', error);
  }
}
