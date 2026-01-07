export const dynamic = "force-dynamic"; // This disables SSG and ISR

import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Post({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
    },
  });

  if (!post) {
    notFound();
  }

  // Server action to delete the post
  async function deletePost() {
    "use server";

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    redirect("/posts");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12">
      <Card className="max-w-4xl w-full">
        <CardHeader className="pb-8">
          <CardTitle className="text-6xl font-extrabold leading-tight">
            {post.title}
          </CardTitle>
          <CardDescription className="text-xl mt-4">
            by{" "}
            <span className="font-medium">
              {post.author?.name || "Anonymous"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="prose prose-lg max-w-none dark:prose-invert text-lg leading-relaxed">
            {post.content ? (
              <p className="text-foreground">{post.content}</p>
            ) : (
              <p className="text-muted-foreground italic text-lg">
                No content available for this post.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <form action={deletePost} className="mt-12">
        <Button
          type="submit"
          variant="destructive"
          size="lg"
          className="px-8 py-3 text-lg">
          Delete Post
        </Button>
      </form>
    </div>
  );
}
