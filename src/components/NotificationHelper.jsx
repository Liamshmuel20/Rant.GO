import { Notification } from '@/api/entities';
import { createPageUrl } from '@/utils';

export const createNotification = async (userEmail, title, message, type, relatedId = null, actionUrl = null) => {
  try {
    await Notification.create({
      user_email: userEmail,
      title,
      message,
      type,
      related_id: relatedId,
      action_url: actionUrl
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notificationTypes = {
  MESSAGE: 'message',
  APPROVAL: 'approval', 
  PAYMENT: 'payment',
  STATUS_UPDATE: 'status_update',
  SYSTEM: 'system'
};

// Helper functions for common notifications
export const notifyNewMessage = async (receiverEmail, senderName, contractId) => {
  await createNotification(
    receiverEmail,
    'הודעה חדשה',
    `קיבלת הודעה חדשה מ${senderName}`,
    notificationTypes.MESSAGE,
    contractId,
    createPageUrl(`Chat?contractId=${contractId}`)
  );
};

export const notifyRentalApproval = async (tenantEmail, productTitle, contractId) => {
  await createNotification(
    tenantEmail,
    'בקשת השכרה אושרה!',
    `בקשת ההשכרה עבור "${productTitle}" אושרה. יש להשלים תשלום.`,
    notificationTypes.APPROVAL,
    contractId,
    createPageUrl(`PaymentInstructions?contractId=${contractId}`)
  );
};

export const notifyPaymentReceived = async (landlordEmail, tenantName, productTitle) => {
  await createNotification(
    landlordEmail,
    'תשלום התקבל',
    `${tenantName} שילם עבור "${productTitle}". הכסף יועבר אליך לאחר אישור מנהלת המערכת.`,
    notificationTypes.PAYMENT
  );
};

export const notifyRentalActive = async (userEmail, productTitle, contractId) => {
  await createNotification(
    userEmail,
    'ההשכרה פעילה!',
    `ההשכרה עבור "${productTitle}" כעת פעילה. ניתן לתאם מסירה בצ'אט.`,
    notificationTypes.STATUS_UPDATE,
    contractId,
    createPageUrl(`Chat?contractId=${contractId}`)
  );
};