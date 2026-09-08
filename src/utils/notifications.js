import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, getDocs, setDoc, getDoc, arrayUnion } from 'firebase/firestore';

// Helper to normalize user email key
const normalizeEmail = (email) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

const getCandidateEmails = (userEmail) => {
  const emails = new Set();
  if (userEmail) emails.add(normalizeEmail(userEmail));
  return Array.from(emails).filter(Boolean);
};

/**
 * Send a notification to a specific user (Candidate or HR)
 */
export const sendNotification = async ({
  recipientEmail,
  recipientRole = null,
  title,
  message,
  type = 'general',
  link = '',
  metadata = {}
}) => {
  const targetEmail = normalizeEmail(recipientEmail);
  const targetRole = recipientRole || (targetEmail.startsWith('hr') || targetEmail === 'hr@vieclam.pro' ? 'hr' : 'candidate');

  const newNotification = {
    recipientEmail: targetEmail,
    recipientRole: targetRole,
    title,
    message,
    type,
    link,
    metadata,
    isRead: false,
    timestamp: Date.now(),
    dateStr: new Date().toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  };

  // 1. Save to Firestore
  try {
    const docRef = await addDoc(collection(db, 'notifications'), newNotification);
    newNotification.id = docRef.id;
  } catch (error) {
    console.error("Error saving notification to Firestore:", error);
    newNotification.id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }

  return newNotification;
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    if (notificationId && !notificationId.startsWith('notif_') && !notificationId.startsWith('app_notif_')) {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
    }
  } catch (error) {
    console.error("Error marking notification as read in Firestore:", error);
  }
};

/**
 * Mark all notifications for a user as read
 */
export const markAllNotificationsAsRead = async (userEmail, userRole, currentNotifList = []) => {
  const targetEmail = normalizeEmail(userEmail);

  try {
    const notifsSnap = await getDocs(collection(db, 'notifications'));
    const updates = [];
    notifsSnap.forEach((docItem) => {
      const data = docItem.data();
      const match = data.recipientEmail === targetEmail || (!data.recipientEmail && targetEmail === 'hr@vieclam.pro');
      if (match && !data.isRead) {
        updates.push(updateDoc(doc(db, 'notifications', docItem.id), { isRead: true }).catch(() => {}));
      }
    });
    await Promise.all(updates);
  } catch (error) {
    console.error("Error batch marking notifications as read:", error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    if (notificationId && !notificationId.startsWith('notif_') && !notificationId.startsWith('app_notif_')) {
      await deleteDoc(doc(db, 'notifications', notificationId));
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};

/**
 * Custom hook to subscribe to real-time notifications for the current user (Candidate or HR)
 * Automatically syncs with both Firestore notifications and real-time application updates!
 */
export const useNotifications = (userEmail, userRole = null, uid = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const targetEmail = normalizeEmail(userEmail);
  const isHR = userRole === 'hr' || targetEmail.startsWith('hr') || targetEmail === 'hr@vieclam.pro';

  // Persist deleted IDs across rebuilds (reset each page session is fine)
  const deletedIdsRef = useRef(new Set());
  const readIdsRef = useRef(new Set());
  const rawNotifsRef = useRef([]);
  const rawAppsRef = useRef([]);
  const unsubNotifsRef = useRef(null);
  const unsubAppsRef = useRef(null);

  const rebuildNotifications = useCallback(() => {
    const deletedIds = deletedIdsRef.current;
    const readIds = readIdsRef.current;
    const rawNotifs = rawNotifsRef.current;
    const rawApps = rawAppsRef.current;
    const candidateEmails = getCandidateEmails(targetEmail);
    const combinedMap = new Map();
    const seenEventKeys = new Set();

    // 1. Process items from notifications collection
    rawNotifs.forEach(item => {
      if (!item || !item.id || deletedIds.has(item.id)) return;
      const isRead = item.isRead || readIds.has(item.id);

      // Deduplicate duplicate notification documents in Firestore
      const eventAppId = item.metadata?.applicationId || item.metadata?.appId || item.metadata?.cvId || '';
      const eventJobId = item.metadata?.jobId || '';
      const eventKey = `${item.type || ''}_${eventAppId || eventJobId}_${item.title || ''}_${item.recipientEmail || ''}`;

      if (seenEventKeys.has(eventKey)) return;
      seenEventKeys.add(eventKey);

      combinedMap.set(item.id, { ...item, isRead });

      if (eventAppId) {
        seenEventKeys.add(`${item.type || ''}_${eventAppId}`);
        seenEventKeys.add(`applied_${eventAppId}`);
        seenEventKeys.add(`interview_${eventAppId}`);
        seenEventKeys.add(`rejected_${eventAppId}`);
        seenEventKeys.add(`viewed_${eventAppId}`);
      }
    });

    // 2. Synthesize fallback notifications from applications collection
    rawApps.forEach(app => {
      if (!app || !app.id) return;
      const appEmail = normalizeEmail(app.applicantEmail);

      if (isHR) {
        const appHREmail = normalizeEmail(app.hrEmail || app.postedByEmail);
        const isMyHRApp = (appHREmail && appHREmail === targetEmail) ||
                          (!appHREmail && (targetEmail === 'hr@vieclam.pro' || !targetEmail));

        if (isMyHRApp) {
          const notifId = 'app_notif_hr_' + app.id;
          const hrEventKey = `applied_${app.id}`;
          if (!deletedIds.has(notifId) && !combinedMap.has(notifId) && !seenEventKeys.has(hrEventKey)) {
            const isRead = readIds.has(notifId);
            seenEventKeys.add(hrEventKey);
            combinedMap.set(notifId, {
              id: notifId,
              recipientEmail: targetEmail || 'hr@vieclam.pro',
              recipientRole: 'hr',
              title: 'Hồ sơ ứng tuyển mới',
              message: `Ứng viên ${app.applicantName || 'mới'} vừa nộp CV ứng tuyển vị trí "${app.title}".`,
              type: 'applied',
              link: `/hr-dashboard?tab=cv&cvId=${app.id}&action=highlight`,
              metadata: { cvId: app.id, applicationId: app.id, applicantName: app.applicantName, applicantEmail: app.applicantEmail, title: app.title, jobId: app.jobId },
              timestamp: app.timestamp || Date.now(),
              dateStr: app.date || 'Gần đây',
              isRead
            });
          }
        }
      } else {
        const isCandidateApp = candidateEmails.some(ce => ce === appEmail || (appEmail && ce.includes(appEmail)) || (ce && appEmail.includes(ce))) ||
                              (!targetEmail && candidateEmails.length === 0);

        if (isCandidateApp) {
          if (app.status === 'Đã duyệt' || app.interviewTime) {
            const notifId = 'app_notif_interview_' + app.id;
            const eventKey = `interview_${app.id}`;
            if (!deletedIds.has(notifId) && !combinedMap.has(notifId) && !seenEventKeys.has(eventKey)) {
              const isRead = readIds.has(notifId);
              seenEventKeys.add(eventKey);
              combinedMap.set(notifId, {
                id: notifId, recipientEmail: appEmail || targetEmail, recipientRole: 'candidate',
                title: `Thư mời phỏng vấn - ${app.company || 'Doanh nghiệp'}`,
                message: `Chúc mừng bạn! Nhà tuyển dụng ${app.company || 'Doanh nghiệp'} đã duyệt hồ sơ và gửi lịch hẹn phỏng vấn vị trí "${app.title}" vào lúc ${app.interviewTime || 'sắp tới'}.`,
                type: 'interview', link: `/profile?tab=applications&appId=${app.id}&action=interview`,
                metadata: { applicationId: app.id, appId: app.id, jobId: app.jobId, title: app.title, company: app.company, action: 'interview' },
                timestamp: app.viewedAt ? app.viewedAt + 1000 : (app.timestamp || Date.now()) + 500,
                dateStr: app.updatedDate || app.date || 'Gần đây', isRead
              });
            }
          }

          if (app.status === 'Từ chối') {
            const notifId = 'app_notif_reject_' + app.id;
            const eventKey = `rejected_${app.id}`;
            if (!deletedIds.has(notifId) && !combinedMap.has(notifId) && !seenEventKeys.has(eventKey)) {
              const isRead = readIds.has(notifId);
              seenEventKeys.add(eventKey);
              combinedMap.set(notifId, {
                id: notifId, recipientEmail: appEmail || targetEmail, recipientRole: 'candidate',
                title: 'Kết quả xét duyệt hồ sơ',
                message: `Hồ sơ ứng tuyển vị trí "${app.title}" tại ${app.company || 'Doanh nghiệp'} đã được phản hồi: ${app.rejectionReason || 'Chưa phù hợp với tiêu chí hiện tại'}.`,
                type: 'rejected', link: `/profile?tab=applications&appId=${app.id}&action=reject`,
                metadata: { applicationId: app.id, appId: app.id, jobId: app.jobId, title: app.title, company: app.company, action: 'reject' },
                timestamp: (app.timestamp || Date.now()) + 500,
                dateStr: app.updatedDate || app.date || 'Gần đây', isRead
              });
            }
          }

          if (app.status === 'Đã xem hồ sơ') {
            const notifId = 'app_notif_viewed_' + app.id;
            const eventKey = `viewed_${app.id}`;
            if (!deletedIds.has(notifId) && !combinedMap.has(notifId) && !seenEventKeys.has(eventKey)) {
              const isRead = readIds.has(notifId);
              seenEventKeys.add(eventKey);
              combinedMap.set(notifId, {
                id: notifId, recipientEmail: appEmail || targetEmail, recipientRole: 'candidate',
                title: 'Nhà tuyển dụng đã xem hồ sơ',
                message: `Nhà tuyển dụng ${app.company || 'Doanh nghiệp'} đã mở xem hồ sơ ứng tuyển vị trí "${app.title}" của bạn.`,
                type: 'viewed', link: `/profile?tab=applications&appId=${app.id}&action=viewed`,
                metadata: { applicationId: app.id, appId: app.id, jobId: app.jobId, title: app.title, company: app.company, action: 'viewed' },
                timestamp: app.viewedAt || (app.timestamp || Date.now()),
                dateStr: app.updatedDate || app.date || 'Gần đây', isRead
              });
            }
          }

          const applyNotifId = 'app_notif_applied_' + app.id;
          const appliedEventKey = `applied_${app.id}`;
          if (!deletedIds.has(applyNotifId) && !combinedMap.has(applyNotifId) && !seenEventKeys.has(appliedEventKey)) {
            const isRead = readIds.has(applyNotifId);
            seenEventKeys.add(appliedEventKey);
            combinedMap.set(applyNotifId, {
              id: applyNotifId, recipientEmail: appEmail || targetEmail, recipientRole: 'candidate',
              title: 'Ứng tuyển thành công',
              message: `Hồ sơ ứng tuyển vị trí "${app.title}" tại ${app.company || 'Doanh nghiệp'} đã được gửi thành công và đang chờ xét duyệt.`,
              type: 'applied', link: `/profile?tab=applications&appId=${app.id}&action=detail`,
              metadata: { applicationId: app.id, appId: app.id, jobId: app.jobId, title: app.title, company: app.company, action: 'detail' },
              timestamp: app.timestamp || Date.now(),
              dateStr: app.date || 'Gần đây', isRead
            });
          }
        }
      }
    });

    const sortedList = Array.from(combinedMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    setNotifications(sortedList);
    setUnreadCount(sortedList.filter(n => !n.isRead).length);
    setLoading(false);
  }, [targetEmail, isHR]);

  useEffect(() => {
    // Reset refs when user changes
    deletedIdsRef.current = new Set();
    readIdsRef.current = new Set();
    rawNotifsRef.current = [];
    rawAppsRef.current = [];

    if (!targetEmail) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Load dismissed notification IDs from Firestore first
    const loadDismissed = async () => {
      if (!uid) return;
      try {
        const prefDoc = await getDoc(doc(db, 'userPreferences', uid));
        if (prefDoc.exists()) {
          const dismissed = prefDoc.data().dismissedNotifications || [];
          dismissed.forEach(id => deletedIdsRef.current.add(id));
        }
      } catch (e) {
        // ignore - not critical
      }
    };

    loadDismissed().then(() => {
      // 1. Subscribe to Firestore notifications collection
      const notifsCol = collection(db, 'notifications');
      const candidateEmails = getCandidateEmails(targetEmail);
      const unsubNotifs = onSnapshot(notifsCol, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const docEmail = normalizeEmail(data.recipientEmail);
          const docRole = data.recipientRole;
          const isMatch = isHR
            ? (docEmail === targetEmail || (!docEmail && targetEmail === 'hr@vieclam.pro') || (targetEmail === 'hr@vieclam.pro' && (docRole === 'hr' || docEmail === 'hr@vieclam.pro')))
            : (candidateEmails.includes(docEmail));
          if (isMatch) list.push({ id: d.id, ...data });
        });
        rawNotifsRef.current = list;
        rebuildNotifications();
      }, (error) => {
        console.error("Notifications listener error:", error);
      });

      // 2. Subscribe to Firestore applications collection
      const appsCol = collection(db, 'applications');
      const unsubApps = onSnapshot(appsCol, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        rawAppsRef.current = list;
        rebuildNotifications();
      }, (error) => {
        console.error("Applications listener error in notifications:", error);
        rebuildNotifications();
      });

      // Store cleanup functions
      unsubNotifsRef.current = unsubNotifs;
      unsubAppsRef.current = unsubApps;
    });

    return () => {
      if (unsubNotifsRef.current) unsubNotifsRef.current();
      if (unsubAppsRef.current) unsubAppsRef.current();
    };
  }, [targetEmail, isHR, uid, rebuildNotifications]);

  const handleRemoveNotification = useCallback(async (id) => {
    // Immediately add to deletedIds set and trigger UI update
    deletedIdsRef.current.add(id);
    rebuildNotifications();

    // Persist to Firestore so dismissed state survives page reload
    if (uid) {
      try {
        await setDoc(doc(db, 'userPreferences', uid), {
          dismissedNotifications: arrayUnion(id)
        }, { merge: true });
      } catch (error) {
        console.error("Error persisting dismissed notification:", error);
      }
    }

    // Also delete real Firestore notification documents (not synthesized ones)
    if (id && !id.startsWith('app_notif_') && !id.startsWith('notif_')) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (error) {
        console.error("Error deleting notification from Firestore:", error);
      }
    }
  }, [rebuildNotifications, uid]);

  const handleMarkAsRead = useCallback(async (id) => {
    readIdsRef.current.add(id);
    rebuildNotifications();
    if (id && !id.startsWith('notif_') && !id.startsWith('app_notif_')) {
      try {
        const notifRef = doc(db, 'notifications', id);
        await updateDoc(notifRef, { isRead: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  }, [rebuildNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    // Mark all current notifications as read in the ref
    notifications.forEach(n => readIdsRef.current.add(n.id));
    rebuildNotifications();
    // Batch update real Firestore docs
    await markAllNotificationsAsRead(targetEmail, userRole, notifications);
  }, [notifications, targetEmail, userRole, rebuildNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    removeNotification: handleRemoveNotification
  };
};


