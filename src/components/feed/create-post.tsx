"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CreatePost({ providerId }: { providerId: string }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const supabase = createClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);

    try {
      // 1. Create Post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          provider_id: providerId,
          content: content,
        })
        .select()
        .single();

      if (postError) throw postError;

      // 2. Upload Images (Simplified for now - assumes bucket exists)
      if (images.length > 0 && post) {
        for (const file of images) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${post.id}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(fileName, file);

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("post-images").getPublicUrl(fileName);

            await supabase.from("post_images").insert({
              post_id: post.id,
              image_url: publicUrl,
            });
          }
        }
      }

      setContent("");
      setImages([]);
      // Potentially trigger a refresh or parent update
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 rounded-3xl shadow-sm border-primary/5 bg-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Share an update, a recent work, or a tip..."
          className="min-h-[100px] rounded-2xl resize-none border-muted focus-visible:ring-primary text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((file, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-xl overflow-hidden border"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-muted/50">
          <div className="flex gap-2">
            <input
              type="file"
              id="post-images"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <label
              htmlFor="post-images"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-muted text-xs font-medium text-muted-foreground cursor-pointer transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-primary" />
              Add Photos
            </label>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
            className="rounded-full px-6 h-9 bg-primary hover:bg-accent text-xs font-bold shadow-md"
          >
            {isSubmitting ? "Posting..." : "Post Update"}
            {!isSubmitting && <Send className="w-3 h-3 ml-2" />}
          </Button>
        </div>
      </form>
    </Card>
  );
}
