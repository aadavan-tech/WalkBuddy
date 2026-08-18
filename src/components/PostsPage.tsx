import { useMemo, useState } from "react";
import { UserCircle2, Users } from "lucide-react";
import type { PostVisibility, PostReactionValue, Route } from "../types";
import type { PostRecord, PostReactionSummary } from "../lib/posts";
import PostHeader from "./PostHeader";
import PostCard from "./PostCard";
import PostDetailsView from "./PostDetailsView";
import EmptyPosts from "./EmptyPosts";

type PostWithTrail = PostRecord & { trail?: Route };

interface PostsPageProps {
  posts: PostWithTrail[];
  currentUserId?: string;
  reactionState: Record<string, PostReactionSummary>;
  onReact: (postId: string, reaction: PostReactionValue) => void;
  onCreatePost: () => void;
  selectedPostId: string | null;
  onSelectPost: (postId: string | null) => void;
}

const DISTANCE_FILTERS = ["All", "<3km", "3-6km", "6-10km", "10km+"] as const;
type DistanceFilter = (typeof DISTANCE_FILTERS)[number];

const SORT_OPTIONS = ["Newest", "Most Interested"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function matchesDistance(distanceKm: number | undefined, bucket: DistanceFilter) {
  if (bucket === "All") return true;
  if (distanceKm == null) return false;
  if (bucket === "<3km") return distanceKm < 3;
  if (bucket === "3-6km") return distanceKm >= 3 && distanceKm < 6;
  if (bucket === "6-10km") return distanceKm >= 6 && distanceKm < 10;
  return distanceKm >= 10;
}

function sortPosts(list: PostWithTrail[], sortBy: SortOption, reactionState: Record<string, PostReactionSummary>) {
  const sorted = [...list];
  if (sortBy === "Most Interested") {
    sorted.sort((a, b) => (reactionState[b.id]?.interested ?? 0) - (reactionState[a.id]?.interested ?? 0));
  } else {
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return sorted;
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-xs text-gray-500 border-t border-black/15">
      {text}
    </div>
  );
}

export default function PostsPage({
  posts,
  currentUserId,
  reactionState,
  onReact,
  onCreatePost,
  selectedPostId,
  onSelectPost,
}: PostsPageProps) {
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  const filtered = useMemo(
    () => posts.filter((post) => matchesDistance(post.trail?.distanceKm, distanceFilter)),
    [posts, distanceFilter]
  );

  const myPosts = useMemo(
    () => sortPosts(filtered.filter((post) => currentUserId && post.creator_id === currentUserId), sortBy, reactionState),
    [filtered, currentUserId, sortBy, reactionState]
  );

  const communityPosts = useMemo(
    () =>
      sortPosts(
        filtered.filter((post) => post.creator_id !== currentUserId && post.visibility === ("PUBLIC" as PostVisibility)),
        sortBy,
        reactionState
      ),
    [filtered, currentUserId, sortBy, reactionState]
  );

  if (selectedPost) {
    const summary = reactionState[selectedPost.id] ?? { interested: 0, notInterested: 0, userReaction: null };
    return (
      <div className="w-full max-w-3xl mx-auto pb-12">
        <PostDetailsView
          post={selectedPost}
          interestedCount={summary.interested}
          userReaction={summary.userReaction}
          onBack={() => onSelectPost(null)}
          onReact={(reaction) => onReact(selectedPost.id, reaction)}
        />
      </div>
    );
  }

  const hasAnyPosts = posts.length > 0;

  return (
    <div className="w-full space-y-6 max-w-3xl mx-auto pb-12">
      <PostHeader
        title="Posts"
        subtitle="Schedule community walks and see who's in"
        onCreatePost={onCreatePost}
      />

      {hasAnyPosts && (
        <div className="space-y-4 pb-6 border-b border-black/30">
          <div>
            <div className="mb-2 text-[10px] uppercase font-black tracking-wider text-gray-500">
              Distance
            </div>
            <div className="flex gap-x-5 gap-y-1.5 flex-wrap">
              {DISTANCE_FILTERS.map((bucket) => (
                <button
                  key={bucket}
                  onClick={() => setDistanceFilter(bucket)}
                  className={`pb-1 border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${
                    distanceFilter === bucket
                      ? "text-black border-black"
                      : "text-gray-400 border-transparent hover:text-gray-700"
                  }`}
                >
                  {bucket}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase font-black tracking-wider text-gray-500">
              Sort By
            </div>
            <div className="flex gap-x-5 gap-y-1.5 flex-wrap">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`pb-1 border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${
                    sortBy === option
                      ? "text-black border-black"
                      : "text-gray-400 border-transparent hover:text-gray-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!hasAnyPosts ? (
        <EmptyPosts onCreatePost={onCreatePost} />
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-headline text-lg font-black uppercase italic tracking-tight text-[var(--wb-text)] flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-black" />
                <span>My Recent Posts</span>
              </h2>
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                {myPosts.length} post{myPosts.length === 1 ? "" : "s"}
              </span>
            </div>
            {myPosts.length === 0 ? (
              <EmptySection text="You haven't scheduled any walks yet. Use for Post from the Feed or create one here." />
            ) : (
              <div className="divide-y divide-black/15">
                {myPosts.map((post) => (
                  <div key={post.id} className="py-6 first:pt-0">
                    <PostCard
                      post={post}
                      onOpenDetails={onSelectPost}
                      onReact={onReact}
                      userReaction={reactionState[post.id]?.userReaction ?? null}
                      interestedCount={reactionState[post.id]?.interested ?? 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-headline text-lg font-black uppercase italic tracking-tight text-[var(--wb-text)] flex items-center gap-2">
                <Users className="w-5 h-5 text-black" />
                <span>Community Posts</span>
              </h2>
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                {communityPosts.length} post{communityPosts.length === 1 ? "" : "s"}
              </span>
            </div>
            {communityPosts.length === 0 ? (
              <EmptySection text="No public community walks match these filters yet." />
            ) : (
              <div className="divide-y divide-black/15">
                {communityPosts.map((post) => (
                  <div key={post.id} className="py-6 first:pt-0">
                    <PostCard
                      post={post}
                      onOpenDetails={onSelectPost}
                      onReact={onReact}
                      userReaction={reactionState[post.id]?.userReaction ?? null}
                      interestedCount={reactionState[post.id]?.interested ?? 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
