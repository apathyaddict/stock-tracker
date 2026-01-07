"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Post {
  id: number;
  title: string;
  content?: string;
  createdAt: string;
  author?: {
    name: string;
  };
}

// Disable static generation
export const dynamic = "force-dynamic";

function PostsList() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");

  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/posts?page=${page}`);
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await res.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [page]);

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 min-h-[200px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts available.</p>
          ) : (
            <div className="space-y-8 w-full max-w-5xl mx-auto">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-3xl">
                      <Link
                        href={`/posts/${post.id}`}
                        className="hover:text-primary transition-colors">
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-lg">
                      by {post.author?.name || "Anonymous"} •{" "}
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {post.content && (
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {post.content.length > 200
                          ? `${post.content.substring(0, 200)}...`
                          : post.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center space-x-4 mt-8">
            {page > 1 && (
              <Link href={`/posts?page=${page - 1}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/posts?page=${page + 1}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function PostsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Blog Posts</h1>
        <p className="text-muted-foreground">
          Read and share thoughts with the community
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Loading page...</p>
          </div>
        }>
        <PostsList />
      </Suspense>
    </div>
  );
}
