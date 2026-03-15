import { useState, useEffect, useRef } from "react";
import api from "../services/api";

const EMOJIS = ["👍", "❤️", "😂", "🎉"];
const POLL_INTERVAL = 5000;

export default function DiscussionForum({ eventId, isOrganizer = false }) {
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);
    const currentUserId = (() => {
        try { const t = localStorage.getItem("token"); if (!t) return null; return JSON.parse(atob(t.split(".")[1])).userId; } catch { return null; }
    })();

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchMessages = async () => {
        try { const res = await api.get(`/forum/${eventId}`); setMessages(res.data); }
        catch (err) { console.error("Failed to fetch forum messages"); }
        finally { setLoading(false); }
    };

    const handlePost = async () => {
        if (!newMsg.trim()) return;
        try {
            await api.post(`/forum/${eventId}`, { content: newMsg.trim(), isAnnouncement });
            setNewMsg(""); setIsAnnouncement(false); fetchMessages();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
        } catch (err) { alert(err.response?.data?.message || "Failed to post message"); }
    };

    const handleReply = async (parentId) => {
        if (!replyContent.trim()) return;
        try {
            await api.post(`/forum/${eventId}`, { content: replyContent.trim(), parentId });
            setReplyTo(null); setReplyContent(""); fetchMessages();
        } catch (err) { alert(err.response?.data?.message || "Failed to post reply"); }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm("Delete this message?")) return;
        try { await api.delete(`/forum/${eventId}/${messageId}`); fetchMessages(); }
        catch (err) { alert("Failed to delete"); }
    };

    const handlePin = async (messageId) => {
        try { await api.patch(`/forum/${eventId}/${messageId}/pin`); fetchMessages(); }
        catch (err) { alert("Failed to toggle pin"); }
    };

    const handleReact = async (messageId, emoji) => {
        try { await api.post(`/forum/${eventId}/${messageId}/react`, { emoji }); fetchMessages(); }
        catch (err) { console.error("Failed to react"); }
    };

    const topLevel = messages.filter(m => !m.parentId);
    const replies = messages.filter(m => m.parentId);
    const getReplies = (parentId) => replies.filter(r => r.parentId === parentId);

    const sorted = [...topLevel].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isAnnouncement && !b.isAnnouncement) return -1;
        if (!a.isAnnouncement && b.isAnnouncement) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const renderMessage = (msg, isReply = false) => {
        const isOwn = currentUserId === msg.authorId;
        const canDelete = isOrganizer || isOwn;
        const msgReplies = getReplies(msg._id);

        const isEveryoneMention = msg.content.includes("@everyone") && msg.authorRole === "organizer";

        let displayContent = msg.content;
        if (isEveryoneMention) {
            const parts = msg.content.split("@everyone");
            displayContent = parts.map((part, i) => (
                <span key={i}>
                    {part}
                    {i < parts.length - 1 && <strong style={{ color: "var(--primary)", background: "var(--primary-bg)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85em" }}>@everyone</strong>}
                </span>
            ));
        }

        return (
            <div key={msg._id} className="forum-message" style={{
                marginLeft: isReply ? 30 : 0,
                borderLeft: isReply ? "3px solid var(--gray-200)" : msg.isAnnouncement ? "3px solid var(--danger)" : msg.isPinned ? "3px solid var(--warning)" : isEveryoneMention ? "3px solid var(--primary)" : "1px solid var(--border)",
                background: msg.isAnnouncement ? "#fff5f5" : msg.isPinned ? "#fffef0" : isEveryoneMention ? "#f0f7ff" : "var(--white)",
            }}>
                <div className="flex justify-between items-center mb-sm">
                    <div>
                        <strong style={{ color: msg.authorRole === "organizer" ? "var(--danger)" : "var(--text)" }}>{msg.authorName}</strong>
                        {msg.authorRole === "organizer" && <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: "0.7rem" }}>Organizer</span>}
                        {msg.isAnnouncement && <span className="badge badge-warning" style={{ marginLeft: 6, fontSize: "0.7rem" }}>📢 Announcement</span>}
                        {msg.isPinned && <span className="badge badge-warning" style={{ marginLeft: 6, fontSize: "0.7rem", background: "#ffeaa7" }}>📌 Pinned</span>}
                        {isEveryoneMention && <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: "0.7rem" }}>📣 Everyone</span>}
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: 8 }}>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-sm">
                        {isOrganizer && <button onClick={() => handlePin(msg._id)} className="forum-action-btn" title={msg.isPinned ? "Unpin" : "Pin"}>📌</button>}
                        {canDelete && <button onClick={() => handleDelete(msg._id)} className="forum-action-btn" style={{ color: "var(--danger)" }} title="Delete">🗑️</button>}
                    </div>
                </div>

                <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{displayContent}</p>

                <div className="flex items-center gap-sm flex-wrap">
                    {EMOJIS.map(emoji => {
                        const reactors = msg.reactions?.[emoji] || [];
                        const hasReacted = reactors.includes(currentUserId);
                        return (
                            <button key={emoji} onClick={() => handleReact(msg._id, emoji)}
                                className={`forum-reaction ${hasReacted ? "reacted" : ""}`}>
                                {emoji} {reactors.length > 0 && <span style={{ fontSize: "0.75rem" }}>{reactors.length}</span>}
                            </button>
                        );
                    })}
                    {!isReply && (
                        <button onClick={() => setReplyTo(replyTo === msg._id ? null : msg._id)} className="forum-action-btn" style={{ fontSize: "0.8rem" }}>💬 Reply</button>
                    )}
                </div>

                {replyTo === msg._id && (
                    <div className="flex gap-sm mt-sm">
                        <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..."
                            onKeyDown={(e) => e.key === "Enter" && handleReply(msg._id)} style={{ flex: 1 }} />
                        <button onClick={() => handleReply(msg._id)} className="btn-primary btn-sm">Reply</button>
                    </div>
                )}

                {msgReplies.map(r => renderMessage(r, true))}
            </div>
        );
    };

    if (loading) return <p>Loading forum...</p>;

    return (
        <div style={{ marginTop: 10 }}>
            <h3 className="mb-sm">💬 Discussion Forum</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 16px" }}>Messages auto-refresh every 5 seconds</p>

            <div className="forum-post-box mb">
                <div className="form-group">
                    <textarea value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Write a message..." />
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        {isOrganizer && (
                            <div className="flex items-center gap">
                                <label style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                                    <input type="checkbox" checked={isAnnouncement} onChange={(e) => setIsAnnouncement(e.target.checked)} style={{ marginRight: 6 }} />
                                    📢 Post as Announcement
                                </label>
                                <button type="button" onClick={() => setNewMsg(prev => prev ? prev + " @everyone " : "@everyone ")} className="btn-secondary btn-sm" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                                    + @everyone
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={handlePost} className="btn-primary btn-sm">Post Message</button>
                </div>
            </div>

            {sorted.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>No messages yet. Start the conversation!</p>
            ) : sorted.map(msg => renderMessage(msg))}
            <div ref={bottomRef} />
        </div>
    );
}
