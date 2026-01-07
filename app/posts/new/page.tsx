"use client";

import Form from "next/form";
import { createPost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewPost() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Share your thoughts and ideas with the community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form action={createPost} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Enter your post title"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Content
              </Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Write your post content here..."
                rows={6}
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Create Post
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
