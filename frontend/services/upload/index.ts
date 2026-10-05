export const uploadService = {
  async uploadFile(file: File, docType: "profile" | "aadhaar_front" | "aadhaar_back", userId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("userId", userId);

    const res = await fetch("/api/users/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload file");
    }
    return res.json();
  },
};
