import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';

/**
 * Send a notification
 * @param {Object} notif { recipientUid, senderUid, title, message, type, link, ... }
 */
export const sendNotification = async (notif) => {
  const colRef = collection(db, 'notifications');
  const docRef = await addDoc(colRef, {
    ...notif,
    isRead: false,
    isDeleted: false,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * Subscribe to notifications for a user
 * @param {string} uid 
 * @param {Function} callback 
 */
export const subscribeUserNotifications = (uid, callback) => {
  if (!uid) return () => {};
  const colRef = collection(db, 'notifications');
  const q = query(
    colRef, 
    where('recipientUid', '==', uid)
  );

  return onSnapshot(q, (snap) => {
    const notifs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(n => !n.isDeleted)
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
        return timeB - timeA;
      });
    callback(notifs);
  }, (err) => console.error("Error subscribing to notifications:", err));
};

/**
 * Mark a notification as read
 * @param {string} notifId 
 */
export const markNotificationAsRead = async (notifId) => {
  if (!notifId) return;
  const docRef = doc(db, 'notifications', notifId);
  await updateDoc(docRef, { isRead: true });
};

/**
 * Mark all notifications as read for a user
 * @param {Array<string>} notifIds 
 */
export const markAllNotificationsAsRead = async (notifIds) => {
  if (!Array.isArray(notifIds)) return;
  for (const id of notifIds) {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { isRead: true });
    } catch {}
  }
};

/**
 * Soft delete a notification
 * @param {string} notifId 
 */
export const deleteNotification = async (notifId) => {
  if (!notifId) return;
  const docRef = doc(db, 'notifications', notifId);
  await updateDoc(docRef, { isDeleted: true });
};
