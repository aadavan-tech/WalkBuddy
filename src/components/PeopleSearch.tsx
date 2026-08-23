import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  UserPlus,
  Check,
  Clock,
  X,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  FollowConnection,
  UserSearchResult,
  listFollowConnections,
  removeFollower,
  respondToFollowRequest,
  searchUsers,
  sendFollowRequest,
  subscribeToFollows,
  unfollowUser,
} from "../lib/db";

interface PeopleSearchProps {
  /** Signed-in user's profile id. Required for any follow action. */
  userId?: string;
  onNotify?: (message: string, tone?: "success" | "info" | "warn") => void;
}

type Tab = "search" | "requests" | "following";

const TABS: { key: Tab; label: string }[] = [
  { key: "search", label: "Find people" },
  { key: "requests", label: "Requests" },
  { key: "following", label: "Following" },
];

export default function PeopleSearch({ userId, onNotify }: PeopleSearchProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [requests, setRequests] = useState<FollowConnection[]>([]);
  const [following, setFollowing] = useState<FollowConnection[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ids with an action in flight, so only that row shows a spinner. */
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const markPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const friendlyError = (err: any) => {
    const msg = err?.message ?? "";
    if (/search_users|list_follow_connections|follows/.test(msg)) {
      return "Following isn't set up on the database yet — run supabase/migration_follows.sql.";
    }
    return msg || "Something went wrong.";
  };

  const refreshLists = useCallback(async () => {
    if (!userId) return;
    try {
      const [req, fol] = await Promise.all([
        listFollowConnections("requests"),
        listFollowConnections("following"),
      ]);
      setRequests(req);
      setFollowing(fol);
      setError(null);
    } catch (err: any) {
      setError(friendlyError(err));
    }
  }, [userId]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  // Live: a new request or an acceptance shows up without a refresh.
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToFollows(userId, refreshLists);
    return unsub;
  }, [userId, refreshLists]);

  // Debounced search so we don't fire a query on every keystroke.
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setBusy(true);
      try {
        setResults(await searchUsers(q));
        setError(null);
      } catch (err: any) {
        setError(friendlyError(err));
      } finally {
        setBusy(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleFollow = async (target: UserSearchResult) => {
    if (!userId) return;
    markPending(target.id, true);
    try {
      if (target.follow_status === "pending" || target.follow_status === "accepted") {
        await unfollowUser(userId, target.id);
        onNotify?.(
          target.follow_status === "accepted"
            ? `Unfollowed @${target.username}`
            : "Request withdrawn",
          "info"
        );
      } else {
        await sendFollowRequest(userId, target.id);
        onNotify?.(`Request sent to @${target.username}`, "success");
      }
      setResults(await searchUsers(query));
      refreshLists();
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      markPending(target.id, false);
    }
  };

  const handleRespond = async (req: FollowConnection, accept: boolean) => {
    markPending(req.follow_id, true);
    try {
      await respondToFollowRequest(req.follow_id, accept);
      onNotify?.(
        accept ? `You and @${req.username} are connected` : "Request declined",
        accept ? "success" : "info"
      );
      refreshLists();
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      markPending(req.follow_id, false);
    }
  };

  const handleUnfollow = async (conn: FollowConnection) => {
    if (!userId) return;
    markPending(conn.follow_id, true);
    try {
      await unfollowUser(userId, conn.id);
      onNotify?.(`Unfollowed @${conn.username}`, "info");
      refreshLists();
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      markPending(conn.follow_id, false);
    }
  };

  /** Avatar + @username + name, shared by every row. */
  const Identity = ({
    avatar,
    username,
    name,
  }: {
    avatar: string | null;
    username: string | null;
    name: string | null;
  }) => (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {avatar ? (
        <img
          src={avatar}
          alt={username ?? "user"}
          className="w-10 h-10 rounded-full object-cover border border-black/15 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-extrabold text-[var(--wb-text)] truncate">
          @{username ?? "unknown"}
        </div>
        {name && <div className="text-xs text-gray-500 truncate">{name}</div>}
      </div>
    </div>
  );

  const smallBtn =
    "px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50";

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/20">
        <Users className="w-5 h-5 text-black shrink-0" />
        <div>
          <h3 className="font-headline text-lg font-extrabold text-[var(--wb-text)] tracking-tight">
            People
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-1 border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${
              tab === t.key
                ? "text-black border-black"
                : "text-gray-400 border-transparent hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.key === "requests" && requests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black text-white text-[9px]">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/40 text-red-700 text-[11px] font-semibold leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!userId && (
        <p className="text-xs text-gray-500 py-4">Sign in to find and follow people.</p>
      )}

      {/* ---------------- SEARCH ---------------- */}
      {tab === "search" && userId && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {busy && (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search @username or name…"
              className="w-full bg-black/5 border border-black/15 rounded-xl pl-9 pr-9 py-2.5 text-sm text-[var(--wb-text)] placeholder:text-gray-400 focus:outline-none focus:border-black/40 transition-colors"
            />
          </div>

          {query.trim().length >= 2 && !busy && results.length === 0 && !error && (
            <p className="text-xs text-gray-500 py-3">
              No one found matching “{query.trim()}”.
            </p>
          )}

          <div className="divide-y divide-black/10">
            {results.map((u) => {
              const isPending = pendingIds.has(u.id);
              const label =
                u.follow_status === "accepted"
                  ? "Following"
                  : u.follow_status === "pending"
                  ? "Requested"
                  : "Follow";
              return (
                <div key={u.id} className="flex items-center gap-3 py-3">
                  <Identity avatar={u.avatar_url} username={u.username} name={u.full_name} />
                  {u.follows_me && u.follow_status !== "accepted" && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 shrink-0">
                      Follows you
                    </span>
                  )}
                  <button
                    onClick={() => handleFollow(u)}
                    disabled={isPending}
                    className={`${smallBtn} shrink-0 ${
                      u.follow_status === "accepted"
                        ? "bg-black/5 text-gray-600 hover:bg-black/10"
                        : u.follow_status === "pending"
                        ? "bg-black/5 text-gray-500 hover:bg-black/10"
                        : "bg-black text-white hover:opacity-85"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1">
                        {u.follow_status === "accepted" ? (
                          <Check className="w-3 h-3" />
                        ) : u.follow_status === "pending" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        {label}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- INCOMING REQUESTS ---------------- */}
      {tab === "requests" && userId && (
        <div className="divide-y divide-black/10">
          {requests.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No pending requests.</p>
          ) : (
            requests.map((r) => {
              const isPending = pendingIds.has(r.follow_id);
              return (
                <div key={r.follow_id} className="flex items-center gap-3 py-3">
                  <Identity avatar={r.avatar_url} username={r.username} name={r.full_name} />
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleRespond(r, true)}
                      disabled={isPending}
                      className={`${smallBtn} bg-black text-white hover:opacity-85`}
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Accept
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleRespond(r, false)}
                      disabled={isPending}
                      className={`${smallBtn} bg-black/5 text-gray-600 hover:bg-black/10`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ---------------- FOLLOWING ---------------- */}
      {tab === "following" && userId && (
        <div className="divide-y divide-black/10">
          {following.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">
              You aren't following anyone yet. Find people by @username.
            </p>
          ) : (
            following.map((f) => (
              <div key={f.follow_id} className="flex items-center gap-3 py-3">
                <Identity avatar={f.avatar_url} username={f.username} name={f.full_name} />
                <button
                  onClick={() => handleUnfollow(f)}
                  disabled={pendingIds.has(f.follow_id)}
                  className={`${smallBtn} bg-black/5 text-gray-600 hover:bg-black/10 shrink-0`}
                >
                  {pendingIds.has(f.follow_id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Unfollow"
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
