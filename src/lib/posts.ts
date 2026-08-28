import { useCallback, useEffect, useMemo, useState } from "react";
import type { Post, PostReaction, PostReactionValue, Route } from "../types";
import { supabase, isSupabaseConfigured } from "./supabase";

const POSTS_STORAGE_KEY = "walkbuddy_posts";
const REACTIONS_STORAGE_KEY = "walkbuddy_post_reactions";

export interface PostReactionSummary {
  interested: number;
  notInterested: number;
  userReaction: PostReactionValue | null;
}

export interface PostRecord extends Post {
  creator_name?: string | null;
  creator_avatar?: string | null;
}

function loadStoredPosts(): PostRecord[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(POSTS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as PostRecord[];
  } catch {
    return [];
  }
}

function loadStoredReactionState(): Record<string, PostReactionSummary> {
  if (typeof window === "undefined") return {};
  const stored = window.localStorage.getItem(REACTIONS_STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as Record<string, PostReactionSummary>;
  } catch {
    return {};
  }
}

function isRecoverablePostStorageError(err: unknown): boolean {
  const message = typeof err === "object" && err !== null && "message" in err
    ? String((err as { message?: unknown }).message ?? "")
    : String(err ?? "");

  return /(schema cache|could not find the table|relation .* does not exist|posts.*does not exist|pgrst|not found)/i.test(message);
}

export function usePosts(routes: Route[], currentUserId?: string) {
  const [posts, setPosts] = useState<PostRecord[]>(() => loadStoredPosts());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactionState, setReactionState] = useState<Record<string, PostReactionSummary>>(() => loadStoredReactionState());

  useEffect(() => {
    window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    window.localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactionState));
  }, [reactionState]);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("posts")
          .select("*")
          .order("scheduled_at", { ascending: false });

        if (fetchError) throw fetchError;

        const remotePosts = (data as PostRecord[] | null) ?? [];
        if (!cancelled) {
          setPosts((prev) => (prev.length ? prev : remotePosts));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not load community posts.";
        if (!cancelled) {
          if (isRecoverablePostStorageError(err)) {
            console.warn("[WalkBuddy] Posts table is unavailable in the connected Supabase schema; using local fallback data.", message);
            setError(null);
          } else {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, []);

  const postMap = useMemo(() => {
    const routeLookup = new Map(routes.map((route) => [route.id, route]));
    return Object.fromEntries(
      posts.map((post) => {
        const route = routeLookup.get(post.trail_id);
        return [post.id, { ...post, trail: route }];
      })
    );
  }, [posts, routes]);

  const createPost = useCallback(
    async (nextPost: Post) => {
      const normalized: PostRecord = {
        ...nextPost,
        creator_id: nextPost.creator_id || currentUserId || "unknown-user",
      };

      setPosts((prev) => [normalized, ...prev]);
      setReactionState((prev) => ({
        ...prev,
        [normalized.id]: {
          interested: 0,
          notInterested: 0,
          userReaction: null,
        },
      }));

      if (!isSupabaseConfigured) return;

      try {
        const { error } = await supabase.from("posts").insert(normalized);
        if (error) throw error;
      } catch (err: unknown) {
        if (isRecoverablePostStorageError(err)) {
          console.warn("[WalkBuddy] Remote post publish skipped because the posts table is not available in Supabase.", err);
          return;
        }
        setError(err instanceof Error ? err.message : "Could not publish your post.");
      }
    },
    [currentUserId]
  );

  const reactToPost = useCallback(
    async (postId: string, reaction: PostReactionValue) => {
      const current = reactionState[postId] ?? {
        interested: 0,
        notInterested: 0,
        userReaction: null,
      };

      const nextUserReaction = current.userReaction === reaction ? null : reaction;
      const nextState: PostReactionSummary = {
        interested: current.interested + (nextUserReaction === "INTERESTED" && current.userReaction !== "INTERESTED" ? 1 : 0) - (current.userReaction === "INTERESTED" ? 1 : 0),
        notInterested: current.notInterested + (nextUserReaction === "NOT_INTERESTED" && current.userReaction !== "NOT_INTERESTED" ? 1 : 0) - (current.userReaction === "NOT_INTERESTED" ? 1 : 0),
        userReaction: nextUserReaction,
      };

      setReactionState((prev) => ({
        ...prev,
        [postId]: nextState,
      }));

      if (!currentUserId || !isSupabaseConfigured) return;

      try {
        const { error } = await supabase.from("post_reactions").upsert(
          {
            post_id: postId,
            user_id: currentUserId,
            reaction,
          },
          { onConflict: "post_id,user_id" }
        );
        if (error) throw error;
      } catch (err: unknown) {
        if (isRecoverablePostStorageError(err)) {
          console.warn("[WalkBuddy] Post reactions are unavailable in the connected Supabase schema; keeping local reaction state.", err);
          return;
        }
        setError(err instanceof Error ? err.message : "Could not save your reaction.");
      }
    },
    [currentUserId, reactionState]
  );

  const deletePost = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    } catch (err: unknown) {
      if (isRecoverablePostStorageError(err)) {
        console.warn("[WalkBuddy] Remote post delete skipped because the posts table is not available in Supabase.", err);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not delete that post.");
    }
  }, []);

  return {
    posts,
    loading,
    error,
    reactionState,
    createPost,
    reactToPost,
    deletePost,
    postMap,
  };
}

export function usePost(postId: string, posts: PostRecord[] = []) {
  return useMemo(() => posts.find((post) => post.id === postId) ?? null, [postId, posts]);
}

export function useCreatePost() {
  return useCallback((nextPost: Post) => ({
    id: nextPost.id,
    ...nextPost,
  }), []);
}

export function useReactToPost() {
  return useCallback((reaction: PostReactionValue) => reaction, []);
}

export function useDeletePost() {
  return useCallback((postId: string) => postId, []);
}
