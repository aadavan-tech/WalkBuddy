import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Search,
  Check,
  CheckCheck,
  Phone,
  Video,
  MapPin,
  Navigation,
  Clock,
  UserCheck,
  Users,
  Sparkles,
  ChevronLeft,
  Compass,
  Footprints,
  Flame,
  ShieldCheck,
  Radio,
  Share2,
  Calendar,
  Smile,
  Zap,
  Tag
} from "lucide-react";
import { ChatThread, ChatMessage } from "../types";

// Initial Loop DM threads with found walking buddies
export const INITIAL_CHAT_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    buddyName: "Rohan Verma",
    buddyAvatar: "https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?auto=format&fit=crop&w=300&q=80",
    status: "Walking Now",
    distanceStr: "0.3 km away",
    meetupTrailName: "Lalbagh Morning Loop",
    unreadCount: 2,
    lastMessage: "Hey, should we do 2 loops or 3 loops around the glasshouse?",
    lastMessageTime: "10:42 AM",
    messages: [
      {
        id: "m-1",
        sender: "buddy",
        text: "Hey! Saw you joined my Lalbagh morning walk ping! 🌿",
        time: "10:30 AM",
        status: "read",
      },
      {
        id: "m-2",
        sender: "me",
        text: "Yes! Super excited for tomorrow's 6:30 AM pace. I usually target 5.5 km/h.",
        time: "10:32 AM",
        status: "read",
      },
      {
        id: "m-3",
        sender: "buddy",
        text: "Awesome, I'll be waiting near the North Gate glasshouse entry point. Look for a green jacket! 🧥",
        time: "10:35 AM",
        status: "read",
        attachment: {
          type: "location",
          title: "Lalbagh Glasshouse North Gate",
          subtext: "GPS: 12.9507° N, 77.5848° E • Pace Match: 98%",
        },
      },
      {
        id: "m-4",
        sender: "me",
        text: "Perfect, see you there! 🚶‍♂️",
        time: "10:38 AM",
        status: "read",
      },
      {
        id: "m-5",
        sender: "buddy",
        text: "Hey, should we do 2 loops or 3 loops around the glasshouse?",
        time: "10:42 AM",
        status: "read",
      },
    ],
  },
  {
    id: "thread-2",
    buddyName: "Ananya M.",
    buddyAvatar: "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=300&q=80",
    status: "Online",
    distanceStr: "0.6 km away",
    meetupTrailName: "Cubbon Park Stroll",
    unreadCount: 1,
    lastMessage: "Saturday morning 7:00 AM works great for Cubbon Park!",
    lastMessageTime: "Yesterday",
    messages: [
      {
        id: "m-201",
        sender: "me",
        text: "Hi Ananya, thanks for connecting on Loop! Loved your Cubbon park route post.",
        time: "Yesterday 4:15 PM",
        status: "read",
      },
      {
        id: "m-202",
        sender: "buddy",
        text: "Hey there! Thanks! The bamboo grove section is so peaceful in the mornings. 🎋",
        time: "Yesterday 4:20 PM",
        status: "read",
      },
      {
        id: "m-203",
        sender: "buddy",
        text: "Saturday morning 7:00 AM works great for Cubbon Park!",
        time: "Yesterday 4:22 PM",
        status: "read",
      },
    ],
  },
  {
    id: "thread-3",
    buddyName: "Vikram Seth",
    buddyAvatar: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=300&q=80",
    status: "Nearby (200m)",
    distanceStr: "200m away",
    meetupTrailName: "Sankey Tank Sprint Drills",
    unreadCount: 0,
    lastMessage: "Dropped a pin for 100m interval reps along the lake perimeter!",
    lastMessageTime: "Jul 21",
    messages: [
      {
        id: "m-301",
        sender: "buddy",
        text: "Yo buddy! I saw your profile in nearby WalkBuddies!",
        time: "Jul 21 8:10 AM",
        status: "read",
      },
      {
        id: "m-302",
        sender: "buddy",
        text: "Dropped a pin for 100m interval reps along the lake perimeter!",
        time: "Jul 21 8:12 AM",
        status: "read",
        attachment: {
          type: "trail",
          title: "Sankey Tank Sprint Circuit (3.2 km)",
          subtext: "Interval Drills • High Intensity Pace",
        },
      },
      {
        id: "m-303",
        sender: "me",
        text: "Sounds super energizing! Count me in for interval reps.",
        time: "Jul 21 8:15 AM",
        status: "read",
      },
    ],
  },
  {
    id: "thread-4",
    buddyName: "Karthik R.",
    buddyAvatar: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?auto=format&fit=crop&w=300&q=80",
    status: "Offline",
    distanceStr: "1.2 km away",
    meetupTrailName: "Indiranagar 100ft Rd Power Walk",
    unreadCount: 0,
    lastMessage: "Great power walk session today! Hit 7,200 steps together!",
    lastMessageTime: "Jul 19",
    messages: [
      {
        id: "m-401",
        sender: "buddy",
        text: "Great power walk session today! Hit 7,200 steps together!",
        time: "Jul 19 8:30 PM",
        status: "read",
      },
      {
        id: "m-402",
        sender: "me",
        text: "Indeed! That 5.8 km/h pace felt amazing. Catch you on the next walk!",
        time: "Jul 19 8:32 PM",
        status: "read",
      },
    ],
  },
  {
    id: "thread-5",
    buddyName: "Divya M.",
    buddyAvatar: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80",
    status: "Online",
    distanceStr: "0.5 km away",
    meetupTrailName: "Koramangala 4th Block Jog",
    unreadCount: 0,
    lastMessage: "Hi! Ready for tomorrow's morning jog near NGV perimeter?",
    lastMessageTime: "Jul 18",
    messages: [
      {
        id: "m-501",
        sender: "buddy",
        text: "Hi! Ready for tomorrow's morning jog near NGV perimeter?",
        time: "Jul 18 6:00 PM",
        status: "read",
      },
    ],
  },
];

interface BuddyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatThreads: ChatThread[];
  onUpdateThreads: (updatedThreads: ChatThread[] | ((prev: ChatThread[]) => ChatThread[])) => void;
}

export default function BuddyChatModal({
  isOpen,
  onClose,
  chatThreads,
  onUpdateThreads,
}: BuddyChatModalProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "active" | "invites">("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = chatThreads.find((t) => t.id === selectedThreadId);

  // Always reset to general chat list when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedThreadId(null);
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    setSelectedThreadId(null);
    onClose();
  };

  // Auto scroll to bottom of active chat
  useEffect(() => {
    if (activeThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThread?.messages]);

  if (!isOpen) return null;

  // Filter threads by query & category tab
  const filteredThreads = chatThreads.filter((t) => {
    const matchesSearch =
      t.buddyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.meetupTrailName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === "active") return t.status.includes("Walking") || t.status.includes("Online");
    if (filterCategory === "invites") return t.unreadCount > 0;
    return true;
  });

  // Handle selecting a thread
  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);

    onUpdateThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          unreadCount: 0,
          messages: t.messages.map((m) => ({ ...m, status: "read" as const })),
        };
      })
    );
  };

  // Handle sending a user message (NO auto-replies)
  const handleSendMessage = (textToSend?: string) => {
    const finalMsg = textToSend || inputText;
    if (!finalMsg.trim() || !activeThread) return;

    const threadId = activeThread.id;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "me",
      text: finalMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "delivered",
    };

    onUpdateThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          lastMessage: finalMsg.trim(),
          lastMessageTime: "Just now",
          messages: [...t.messages, newMsg],
        };
      })
    );
    setInputText("");
    setShowEmojiPicker(false);
  };

  const handleQuickChip = (chipText: string) => {
    handleSendMessage(chipText);
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 md:p-8 animate-fadeIn select-none">
      {/* Container */}
      <div className="w-full max-w-3xl h-[88vh] max-h-[760px] bg-[var(--wb-surface)] text-[var(--wb-text)] border border-[var(--wb-line)] rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans relative">

        {/* ================= HEADER ================= */}
        <div className="p-4 bg-[var(--wb-card)] border-b border-[var(--wb-line)] flex items-center justify-between shrink-0">
          {activeThread ? (
            /* Active Person's Chat Header */
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSelectedThreadId(null)}
                className="p-1.5 rounded-xl bg-[var(--wb-surface)] text-black hover:bg-black/5 border border-[var(--wb-line)] transition-all flex items-center gap-1 shrink-0 text-xs font-bold"
                title="Back to All Chats"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
                <span className="hidden sm:inline">Chats</span>
              </button>

              <img
                src={activeThread.buddyAvatar}
                alt={activeThread.buddyName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-2xl object-cover border border-black/30 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <h3 className="font-headline font-extrabold text-sm text-[var(--wb-text)] flex items-center gap-2 truncate">
                  <span className="truncate">{activeThread.buddyName}</span>
                  <span className="bg-[#f0e4cc] border border-black/30 text-black text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0">
                    {activeThread.meetupTrailName}
                  </span>
                </h3>
                <p className="text-[10px] text-gray-500 flex items-center gap-1.5 font-mono truncate">
                  <span
                    className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                      activeThread.status.includes("Walking")
                        ? "bg-black"
                        : activeThread.status.includes("Online")
                        ? "bg-gray-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span>{activeThread.status}</span>
                  <span>•</span>
                  <span className="truncate">{activeThread.distanceStr}</span>
                </p>
              </div>
            </div>
          ) : (
            /* Chat History List Header - Simply 'Chat' */
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-md shrink-0">
                <MessageCircle className="w-5 h-5 stroke-[2.5] text-white" />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg text-[var(--wb-text)] tracking-wide">
                  Chat
                </h3>
              </div>
            </div>
          )}

          {/* Close Modal Button */}
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-gray-500 hover:text-black hover:bg-black/5 transition-colors shrink-0 ml-2"
            title="Close Chat"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* ================= BODY CONTENT ================= */}
        {!activeThread ? (
          /* ================= VIEW 1: PEOPLE & CHATS LIST ================= */
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--wb-surface)]">
            {/* Search & Filter Bar */}
            <div className="p-3.5 bg-[var(--wb-card)] border-b border-[var(--wb-line)] space-y-2.5">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-black absolute left-3" />
                <input
                  type="text"
                  placeholder="Search by name, trail, or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--wb-surface)] text-xs text-[var(--wb-text)] placeholder-gray-400 pl-9 pr-3 py-2.5 rounded-xl border border-[var(--wb-line)] focus:outline-none focus:border-black"
                />
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2">
                {[
                  { id: "all", label: `All Chats (${chatThreads.length})` },
                  { id: "active", label: "Walking Now" },
                  { id: "invites", label: "Unread" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-headline font-bold uppercase transition-all ${
                      filterCategory === tab.id
                        ? "bg-black text-white shadow-sm"
                        : "bg-[var(--wb-surface)] text-gray-600 hover:text-black border border-[var(--wb-line)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--wb-line)] p-1">
              {filteredThreads.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Footprints className="w-10 h-10 mx-auto mb-2 opacity-30 text-black" />
                  <p className="text-xs font-semibold">No chats found.</p>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className="w-full p-4 flex items-center gap-3.5 hover:bg-black/5 transition-all text-left rounded-2xl group"
                  >
                    {/* Buddy Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={thread.buddyAvatar}
                        alt={thread.buddyName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover border border-black/30 group-hover:border-black transition-colors"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--wb-surface)] ${
                          thread.status.includes("Walking")
                            ? "bg-black"
                            : thread.status.includes("Online")
                            ? "bg-gray-500"
                            : "bg-gray-300"
                        }`}
                        title={thread.status}
                      />
                    </div>

                    {/* Thread Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-headline font-bold text-sm text-[var(--wb-text)] truncate flex items-center gap-1.5">
                          <span>{thread.buddyName}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
                        </h4>
                        <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                          {thread.lastMessageTime}
                        </span>
                      </div>

                      {/* Trail & Distance */}
                      <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="text-black font-bold truncate">
                          {thread.meetupTrailName}
                        </span>
                        <span className="text-gray-500 font-mono text-[10px]">• {thread.distanceStr}</span>
                      </div>

                      {/* Last Message */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-600 truncate font-normal">
                          {thread.lastMessage}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="bg-black text-white text-[10px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center shrink-0 shadow-sm leading-none">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ================= VIEW 2: INDIVIDUAL CHAT VIEW ================= */
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--wb-surface)]">
            {/* Messages Wall */}
            <div
              className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3.5 custom-scrollbar relative"
            >
              {/* Security Banner */}
              <div className="mx-auto my-1 max-w-md bg-[var(--wb-card)] border border-[var(--wb-line)] text-gray-700 px-3.5 py-2 rounded-2xl text-[10px] text-center shadow-md flex items-center justify-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>
                  Connected via Loop Outdoor GPS. Always meet in open public park areas!
                </span>
              </div>

              {/* Message Items */}
              {activeThread.messages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl shadow-md text-xs leading-relaxed relative ${
                        isMe
                          ? "bg-black text-white font-semibold rounded-tr-none border border-black"
                          : "bg-[var(--wb-card)] text-[var(--wb-text)] font-medium rounded-tl-none border border-[var(--wb-line)]"
                      }`}
                    >
                      {/* Message Text */}
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Optional Card Attachment */}
                      {msg.attachment && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-black/5 border border-[var(--wb-line)] flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {msg.attachment.type === "location" ? (
                              <MapPin className="w-5 h-5 text-black shrink-0" />
                            ) : (
                              <Navigation className="w-5 h-5 text-black shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-[var(--wb-text)] truncate">{msg.attachment.title}</p>
                              {msg.attachment.subtext && (
                                <p className="text-[9px] text-gray-500 truncate">{msg.attachment.subtext}</p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => alert(`📍 Opening GPS navigation to ${msg.attachment?.title}...`)}
                            className="bg-black text-white px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 shadow-md hover:scale-105 transition-transform"
                          >
                            Navigate
                          </button>
                        </div>
                      )}

                      {/* Time & Status */}
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] opacity-70 font-mono">
                        <span>{msg.time}</span>
                        {isMe && (
                          <span title={msg.status === "read" ? "Read" : "Sent / Delivered"}>
                            {msg.status === "read" ? (
                              <CheckCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-gray-400 stroke-[2.2]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-[var(--wb-card)] border-t border-[var(--wb-line)] flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[9px] text-gray-500 font-black uppercase shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-black" />
                <span>Quick:</span>
              </span>
              {[
                "📍 Share My GPS Spot",
                "🗓️ Meet 6:30 AM Tomorrow",
                "🥾 Suggest 5 km Loop",
                "☕ Post-Walk Coffee?",
                "👟 Ready to Start!",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleQuickChip(chip)}
                  className="bg-[var(--wb-surface)] hover:bg-black/5 text-gray-700 border border-[var(--wb-line)] px-3 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all active:scale-95 shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Emoji Picker Bar */}
            {showEmojiPicker && (
              <div className="px-3 py-2 bg-[var(--wb-surface)] border-t border-[var(--wb-line)] flex items-center gap-3 overflow-x-auto">
                {["🚶‍♂️", "🏃‍♀️", "🍃", "📍", "👟", "☕", "🔥", "💪", "✨", "🌳", "👍", "👋"].map(
                  (emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Message Input Bar */}
            <div className="p-3 bg-[var(--wb-card)] border-t border-[var(--wb-line)] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-xl text-gray-600 hover:text-black hover:bg-black/5 transition-colors"
                title="Emojis"
              >
                <Smile className="w-5 h-5 text-black" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickChip("📍 GPS Pin: Trail Meetup Entrance")}
                className="p-2 rounded-xl text-gray-600 hover:text-black hover:bg-black/5 transition-colors"
                title="Share GPS Location"
              >
                <MapPin className="w-5 h-5 text-black" />
              </button>

              <input
                type="text"
                placeholder={`Message ${activeThread.buddyName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-[var(--wb-surface)] text-xs text-[var(--wb-text)] placeholder-gray-400 px-4 py-2.5 rounded-xl border border-[var(--wb-line)] focus:outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  inputText.trim()
                    ? "bg-black shadow-md scale-105"
                    : "bg-[var(--wb-surface)] border border-[var(--wb-line)]"
                }`}
              >
                <Send className={`w-4 h-4 ml-0.5 stroke-[2.5] ${inputText.trim() ? "text-white" : "text-black"}`} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

