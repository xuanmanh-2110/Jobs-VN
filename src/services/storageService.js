
export const uploadCVFile = async (uid, file) => {
  if (!uid || !file) throw new Error("Missing uid or file");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Data = reader.result;
      const timestamp = Date.now();
      const storagePath = `base64_cv_${timestamp}_${file.name}`;

      resolve({
        fileName: file.name,
        downloadURL: base64Data, // Chuỗi Base64 lưu trực tiếp vào Firestore
        storagePath
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Upload ảnh đại diện (Avatar) hoặc logo công ty dưới dạng Base64
 */
export const uploadImageFile = async (uid, file, folder = 'avatars') => {
  if (!uid || !file) throw new Error("Missing uid or file");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Trả về trực tiếp chuỗi Base64 của ảnh để gắn vào thẻ <img> hoặc lưu vào DB
      resolve(reader.result);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Hàm xóa file ảo (Do dùng Base64 lưu trong DB nên không cần thao tác xóa trên Storage ngoài)
 */
export const deleteFileFromStorage = async (storagePath) => {
  if (!storagePath) return;
  // Không cần gọi Firebase Storage nữa nên để trống an toàn tuyệt đối
  return true;
};