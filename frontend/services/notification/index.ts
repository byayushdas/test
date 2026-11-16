export const notificationService = {
  async getInbox(userId: string) {
    const res = await fetch(`/api/messages/inbox?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch inbox");
    return res.json();
  },

  async getMessages(userId: string, otherUserId: string) {
    const res = await fetch(`/api/messages?userId=${userId}&otherUserId=${otherUserId}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, receiverId, content }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },
};
