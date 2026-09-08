export const getBlobUrlFromBase64 = (dataUrl) => {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http')) return dataUrl;
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length < 2) return dataUrl;
    const contentType = parts[0].split(':')[1] || 'application/pdf';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Error converting base64 to blob:', e);
    return dataUrl;
  }
};

export const downloadFile = (fileUrlOrData, fileName) => {
  if (!fileUrlOrData) return;
  try {
    if (fileUrlOrData.startsWith('http://') || fileUrlOrData.startsWith('https://')) {
      const link = document.createElement('a');
      link.href = fileUrlOrData;
      link.download = fileName || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    const blobUrl = getBlobUrlFromBase64(fileUrlOrData);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      try { URL.revokeObjectURL(blobUrl); } catch {}
    }, 10000);
  } catch (err) {
    console.error('Download error:', err);
    window.open(fileUrlOrData, '_blank');
  }
};

export const getCanonicalUserKey = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_');
};

export const clearProfileCache = () => {
  // No-op in Firebase-first architecture
};

export const saveCVToCloud = async () => {};
export const loadCVFromCloud = async () => null;
export const deleteCVFromCloud = async () => {};
export const saveSavedCVListToCloud = async () => {};
export const loadSavedCVListFromCloud = async () => [];
export const fetchUserDataFromCloud = async () => null;
export const syncProfileToApplications = async () => {};
export const syncUserFieldToCloud = async () => {};
export const syncFullProfileToCloud = async () => {};
export const saveApplicationCVData = async () => {};
export const loadApplicationCVData = async () => null;



