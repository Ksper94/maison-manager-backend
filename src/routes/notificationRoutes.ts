import { Router } from 'express';
import { sendTestNotificationController } from '../controllers/notificationController';

const router = Router();

router.post('/send', sendTestNotificationController);

export default router;
