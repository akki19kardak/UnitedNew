// frontend/src/pages/MessagesPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation }   from "react-router-dom";
import { io }            from "socket.io-client";
import axios             from "axios";
import useAuth           from "../contexts/useAuth";
import {
  Send, Search, X, Menu, Loader2, Bell, CheckCheck,
  User, ShieldCheck, Heart, Handshake, Users,
  ChevronRight, MessageSquare, AlertCircle,
} from "lucide-react";

const API        = import.meta.env.VITE_BACKEND_URL   || "http://localhost:5000/api";
const SOCKET_URL = API.replace("/api", "");

// Singleton socket — created once outside component
let socketInstance = null;
const getSocket = () => {
  if (!socketInstance) socketInstance = io(SOCKET_URL, { autoConnect: false });
  return socketInstance;
};

// ── Role badge ──────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    admin:     { label: "Admin",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    ngo:       { label: "NGO",       cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
    donor:     { label: "Donor",     cls: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
    volunteer: { label: "Volunteer", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  };
  const { label, cls } = map[role] || { label: role, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
};

// ── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ contact, size = "md" }) => {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  const colorMap = {
    admin:     "bg-blue-500",
    ngo:       "bg-emerald-500",
    donor:     "bg-purple-500",
    volunteer: "bg-orange-500",
  };
  const bg    = colorMap[contact?.role] || "bg-slate-400";
  const initials = contact?.name?.slice(0, 2).toUpperCase() || "??";
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {contact?.avatar
        ? <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full object-cover" />
        : initials
      }
    </div>
  );
};

// ── Coordination context card (shown inside a message bubble) ────────────────
const ContextCard = ({ messageType, context }) => {
  if (messageType === "chat" || messageType === "support") return null;

  if (messageType === "donate_intent") {
    return (
      <div className="mt-2 bg-white/20 dark:bg-black/20 rounded-lg p-2 text-xs space-y-0.5 border border-white/30">
        <div className="flex items-center gap-1 font-semibold text-yellow-200">
          <Heart className="w-3 h-3" /> Donation Request
        </div>
        {context?.ngoName      && <div>NGO: <span className="font-medium">{context.ngoName}</span></div>}
        {context?.campaignName && <div>Campaign: <span className="font-medium">{context.campaignName}</span></div>}
        {context?.amount > 0   && <div>Amount: <span className="font-medium">₹{context.amount}</span></div>}
      </div>
    );
  }

  if (messageType === "ngo_contact_volunteer") {
    return (
      <div className="mt-2 bg-white/20 dark:bg-black/20 rounded-lg p-2 text-xs space-y-0.5 border border-white/30">
        <div className="flex items-center gap-1 font-semibold text-green-200">
          <Users className="w-3 h-3" /> Volunteer Contact Request
        </div>
        {context?.volunteerName && <div>Volunteer: <span className="font-medium">{context.volunteerName}</span></div>}
        {context?.campaignName  && <div>Campaign: <span className="font-medium">{context.campaignName}</span></div>}
      </div>
    );
  }

  return null;
};

// ── Coordination modal (opened by donors / NGOs before sending) ───────────────
const CoordinationModal = ({ userRole, receiverId, receiverName, onSend, onClose }) => {
  const isDonor = userRole === "donor";
  const isNgo   = userRole === "ngo";

  const [text,          setText]          = useState("");
  const [ngoName,       setNgoName]       = useState("");
  const [campaignName,  setCampaignName]  = useState("");
  const [volunteerName, setVolunteerName] = useState("");
  const [amount,        setAmount]        = useState("");
  const [sending,       setSending]       = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const messageType = isDonor ? "donate_intent" : "ngo_contact_volunteer";
    const context = isDonor
      ? { ngoName, campaignName, amount: parseFloat(amount) || 0 }
      : { volunteerName, campaignName };
    await onSend({ text, messageType, context, receiverId });
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {isDonor
              ? <><Heart className="w-5 h-5 text-purple-500" /> Donate to an NGO</>
              : <><Users className="w-5 h-5 text-emerald-500" /> Contact {receiverName || "Volunteer"}</>
            }
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Donor fields */}
          {isDonor && (
            <>
              <input
                value={ngoName}
                onChange={e => setNgoName(e.target.value)}
                placeholder="NGO Name (e.g. Green Earth Foundation)"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="Campaign Name (optional)"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Donation Amount in ₹ (optional)"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </>
          )}

          {/* NGO fields */}
          {isNgo && (
            <>
              <input
                value={volunteerName}
                onChange={e => setVolunteerName(e.target.value)}
                placeholder="Volunteer Name or ID"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="Related Campaign (optional)"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </>
          )}

          {/* Message for all */}
          <textarea
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your message to admin..."
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex-1 py-2 text-sm rounded-lg bg-primary text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
          >
            {sending ? "Sending..." : `Send to ${receiverName || "Admin"}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  Main MessagesPage
// ════════════════════════════════════════════════════════════════════════════
const MessagesPage = () => {
  const { user, getToken }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const socket     = getSocket();

  const [contacts,       setContacts]       = useState([]);
  const [messages,       setMessages]       = useState({});   // uid → Message[]
  const [activeUid,      setActiveUid]      = useState(null);
  const [inputText,      setInputText]      = useState("");
  const [searchQ,        setSearchQ]        = useState("");
  const [loading,        setLoading]        = useState(true);
  const [showSidebar,    setShowSidebar]    = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [notifications,  setNotifications]  = useState([]);   // toast queue
  const [totalUnread,    setTotalUnread]    = useState(0);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const activeContact  = contacts.find(c => c.uid === activeUid);
  const activeMessages = messages[activeUid] || [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  // ── Load contacts ──────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res     = await axios.get(`${API}/messages/contacts`, { headers });
      let contactList = res.data;

      // Handle "to" query param
      const params = new URLSearchParams(location.search);
      const toUid  = params.get("to");

      if (toUid && !contactList.find(c => c.uid === toUid)) {
        // If "to" user not in list, try to fetch them directly
        try {
          const userRes = await axios.get(`${API}/users/public/${toUid}`, { headers });
          if (userRes.data) {
            contactList = [{
              uid: userRes.data.uid,
              name: userRes.data.organizationName || userRes.data.name || "User",
              role: userRes.data.role,
              avatar: userRes.data.avatar || "",
              unreadCount: 0
            }, ...contactList];
          }
        } catch (err) {
          console.error("Failed to fetch 'to' user:", err);
        }
      }

      setContacts(contactList);

      // Select contact: prefer "to" param, then existing activeUid, then first in list
      if (toUid) {
        setActiveUid(toUid);
      } else if (contactList.length > 0 && !activeUid) {
        setActiveUid(contactList[0].uid);
      }

      // sum unread
      const unread = contactList.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setTotalUnread(unread);
    } catch (err) {
      console.error("Load contacts error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, authHeaders, activeUid, location.search]);

  useEffect(() => { loadContacts(); }, []);   // eslint-disable-line

  // ── Load messages for active contact ──────────────────────────────────────
  useEffect(() => {
    if (!user || !activeUid) return;
    const fetchMsgs = async () => {
      try {
        const headers = await authHeaders();
        const res     = await axios.get(`${API}/messages/${activeUid}`, { headers });
        const formatted = res.data.map(m => ({
          _id:         m._id,
          from:        m.senderId === user.uid ? "me" : "them",
          text:        m.text,
          messageType: m.messageType || "chat",
          context:     m.context    || {},
          time:        new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read:        m.read,
        }));
        setMessages(prev => ({ ...prev, [activeUid]: formatted }));

        // Mark as read via socket + REST
        socket.emit("mark_read", { myUid: user.uid, otherUid: activeUid });
        await axios.patch(`${API}/messages/mark-read/${activeUid}`, {}, { headers });

        // Clear unread in contacts list
        setContacts(prev =>
          prev.map(c => c.uid === activeUid ? { ...c, unreadCount: 0 } : c)
        );
        setTotalUnread(prev => Math.max(0, prev - (contacts.find(c => c.uid === activeUid)?.unreadCount || 0)));
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };
    fetchMsgs();
  }, [activeUid]);   // eslint-disable-line

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    if (!socket.connected) socket.connect();
    socket.emit("register", user.uid);

    const onReceive = (msg) => {
      const formatted = {
        _id:         msg._id,
        from:        "them",
        text:        msg.text,
        messageType: msg.messageType || "chat",
        context:     msg.context     || {},
        time:        new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read:        false,
      };

      setMessages(prev => ({
        ...prev,
        [msg.senderId]: [...(prev[msg.senderId] || []), formatted],
      }));

      // If not in this conversation, bump unread badge
      if (msg.senderId !== activeUid) {
        setContacts(prev =>
          prev.map(c => c.uid === msg.senderId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c)
        );
        setTotalUnread(prev => prev + 1);
      }
    };

    const onNotification = (notif) => {
      // Show a toast for incoming messages
      const toastId = Date.now();
      setNotifications(prev => [...prev, { ...notif, id: toastId }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== toastId)), 4000);
    };

    const onSent = (msg) => {
      const formatted = {
        _id:         msg._id,
        from:        "me",
        text:        msg.text,
        messageType: msg.messageType || "chat",
        context:     msg.context     || {},
        time:        new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read:        false,
      };
      setMessages(prev => ({
        ...prev,
        [msg.receiverId]: [...(prev[msg.receiverId] || []), formatted],
      }));
    };

    socket.on("receive_message", onReceive);
    socket.on("notification",    onNotification);
    socket.on("message_sent",    onSent);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("notification",    onNotification);
      socket.off("message_sent",    onSent);
    };
  }, [user, activeUid]);   // eslint-disable-line

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // ── Send normal message ────────────────────────────────────────────────────
  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !activeUid) return;
    socket.emit("send_message", {
      senderId:  user.uid,
      receiverId: activeUid,
      text,
      messageType: "chat",
    });
    setInputText("");
    inputRef.current?.focus();
  };

  // ── Send coordination message (from modal) ─────────────────────────────────
  const sendCoordination = async ({ text, messageType, context, receiverId }) => {
    try {
      const headers = await authHeaders();
      await axios.post(
        `${API}/messages/coordination`,
        { receiverId, text, messageType, context },
        { headers }
      );
      // Also emit over socket so admin gets real-time notification
      socket.emit("send_message", {
        senderId:    user.uid,
        receiverId,
        text,
        messageType,
        context,
      });
    } catch (err) {
      console.error("Coordination send error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Admin uid (first admin in contact list, or from active contact)
  const adminContact = contacts.find(c => c.role === "admin");

  // Show coordination button only for donor and ngo roles
  const canUseCoordination = user?.role === "donor" || user?.role === "ngo";
  
  // For modal - track selected receiver
  const [modalReceiver, setModalReceiver] = useState(null);

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 relative">

      {/* ── Real-time notification toasts ─────────────────────────────────── */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 max-w-xs animate-slide-in pointer-events-auto"
          >
            <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">New Message</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Coordination Modal ────────────────────────────────────────────── */}
      {showModal && modalReceiver && (
        <CoordinationModal
          userRole={user?.role}
          receiverId={modalReceiver.uid}
          receiverName={modalReceiver.name}
          onSend={sendCoordination}
          onClose={() => { setShowModal(false); setModalReceiver(null); }}
        />
      )}

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`${showSidebar ? "flex" : "hidden"} w-full sm:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 shrink-0 sm:flex`}>

        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Messages
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </h1>
            </div>
            {/* Coordination button for donor / NGO */}
            {canUseCoordination && (
              <button
                onClick={() => {
                  // For donors: open modal with admin
                  // For NGOs: open modal with admin or selected volunteer
                  const receiver = user?.role === "donor" 
                    ? adminContact 
                    : activeContact?.role === "volunteer" 
                      ? activeContact 
                      : adminContact;
                  if (receiver) {
                    setModalReceiver(receiver);
                    setShowModal(true);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                {user?.role === "donor" ? <Heart className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                {user?.role === "donor" ? "Donate to NGO" : "Send Request"}
              </button>
            )}
          </div>

          {/* Role description */}
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            {user?.role === "admin"
              ? "You can message all donors, NGOs, and volunteers."
              : user?.role === "ngo"
              ? "You can message admins and volunteers who joined your campaigns."
              : user?.role === "volunteer"
              ? "You can message admins and NGOs you've volunteered with."
              : "You can message admins and NGOs you've donated to."}
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search contacts..."
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.uid}
                onClick={() => { setActiveUid(contact.uid); setShowSidebar(false); }}
                className={`w-full p-4 flex items-center gap-3 border-l-4 transition-colors text-left ${
                  activeUid === contact.uid
                    ? "bg-primary/5 dark:bg-primary/10 border-primary"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Avatar contact={contact} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {contact.name}
                    </span>
                    {contact.unreadCount > 0 && (
                      <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RoleBadge role={contact.role} />
                    {contact.isVerified && (
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat window ───────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden ${!showSidebar ? "flex" : "hidden sm:flex"}`}>

        {/* Chat header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="sm:hidden p-1.5 text-slate-400 hover:text-primary">
              <Menu className="w-5 h-5" />
            </button>
            {activeContact && <Avatar contact={activeContact} size="sm" />}
            <div>
              <h2 className="font-bold text-sm text-slate-800 dark:text-white">
                {activeContact?.name || "Select a contact"}
              </h2>
              {activeContact && (
                <div className="flex items-center gap-1">
                  <RoleBadge role={activeContact.role} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3">
          {!activeContact ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a contact to start chatting</p>
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm">No messages yet — start the conversation!</p>
            </div>
          ) : (
            activeMessages.map((msg, i) => {
              const isMe = msg.from === "me";
              return (
                <div key={msg._id || i} className={`flex flex-col gap-1 max-w-[78%] ${isMe ? "items-end ml-auto" : "items-start"}`}>
                  <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700"
                  }`}>
                    {msg.text}
                    <ContextCard messageType={msg.messageType} context={msg.context} />
                  </div>
                  <div className="flex items-center gap-1 mx-1">
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                    {isMe && msg.read && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {/* Coordination shortcut for donor/NGO above input */}
          {canUseCoordination && (activeContact?.role === "admin" || activeContact?.role === "volunteer") && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  setModalReceiver(activeContact);
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition"
              >
                {user?.role === "donor"
                  ? <><Heart className="w-3 h-3" /> Request NGO Donation</>
                  : <><Users className="w-3 h-3" /> Send Volunteer Request</>
                }
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeContact ? `Message ${activeContact.name}...` : "Select a contact first"}
              disabled={!activeContact}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || !activeContact}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                inputText.trim() && activeContact
                  ? "bg-primary text-white hover:bg-blue-700"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MessagesPage;
