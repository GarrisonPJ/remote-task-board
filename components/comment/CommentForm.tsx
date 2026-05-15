"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  taskId: string;
};

export function CommentForm({ taskId }: Props) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to post comment");
      return json.data;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment posted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate(content.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={mutation.isPending}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={!content.trim() || mutation.isPending}>
        {mutation.isPending ? "..." : "Post"}
      </Button>
    </form>
  );
}
