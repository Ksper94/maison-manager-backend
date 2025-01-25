import { Request, Response, NextFunction } from 'express';
import { sendPushNotification } from '../utils/notifications';

export async function sendTestNotificationController(req: Request, res: Response, next: NextFunction) {
  try {
    const { pushToken, message } = req.body;

    if (!pushToken || !message) {
      return res.status(400).json({ message: 'Le token et le message sont obligatoires.' });
    }

    await sendPushNotification(pushToken, message);

    return res.status(200).json({ message: 'Notification envoyée avec succès.' });
  } catch (error) {
    next(error);
  }
}
