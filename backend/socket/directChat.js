const mongoose = require("mongoose");

function packMessage(doc) {
  if (!doc) return null;
  const from = doc.from;
  const to = doc.to;
  return {
    _id: doc._id,
    text: doc.text,
    createdAt: doc.createdAt,
    fromId: from?._id != null ? String(from._id) : String(doc.from),
    toId: to?._id != null ? String(to._id) : String(doc.to),
    fromName: from?.name || "",
    toName: to?.name || ""
  };
}

module.exports = function attachDirectChat(io, { DirectMessage, User, jwt, JWT_SECRET }) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!JWT_SECRET || !token) {
      return next(new Error("Unauthorized"));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.userId = String(payload.id);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    socket.join(`user:${uid}`);

    socket.on("dm:send", async (payload, callback) => {
      const cb = typeof callback === "function" ? callback : () => {};

      try {
        const toUserId = String(payload?.toUserId || "").trim();
        const text = String(payload?.text || "").trim();

        if (!mongoose.Types.ObjectId.isValid(toUserId)) {
          return cb({ ok: false, message: "Người nhận không hợp lệ" });
        }
        if (uid === toUserId) {
          return cb({ ok: false, message: "Không thể gửi tin cho chính mình" });
        }
        if (!text) {
          return cb({ ok: false, message: "Nội dung trống" });
        }
        if (text.length > 5000) {
          return cb({ ok: false, message: "Tin nhắn quá dài (tối đa 5000 ký tự)" });
        }

        const peer = await User.findById(toUserId).select("_id active").lean();
        if (!peer || peer.active === false) {
          return cb({ ok: false, message: "Không tìm thấy người nhận" });
        }

        const msg = await DirectMessage.create({
          from: uid,
          to: toUserId,
          text
        });

        const doc = await DirectMessage.findById(msg._id)
          .populate("from", "name")
          .populate("to", "name")
          .lean();

        const out = packMessage(doc);
        io.to(`user:${uid}`).emit("dm", out);
        io.to(`user:${toUserId}`).emit("dm", out);
        return cb({ ok: true, message: out });
      } catch (err) {
        return cb({ ok: false, message: err.message || "Lỗi gửi tin" });
      }
    });
  });
};
