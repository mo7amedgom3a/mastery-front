"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";

import { UserAvatar } from "@/components/layout/user-avatar";
import { setAccountProfile } from "@/lib/account/use-account-profile";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/lib/api/avatar";
import { customerKeys, uploadAvatar, type CustomerProfileResponse } from "@/lib/api/customers";
import { cn } from "@/lib/cn";

function checkFile(file: File): string | null {
  if (!AVATAR_TYPES.has(file.type)) return "الصيغ المدعومة: PNG أو JPG أو WebP.";
  if (file.size > AVATAR_MAX_BYTES) return "حجم الصورة أكبر من 5 ميجابايت.";
  return null;
}

/**
 * The profile picture with a "change" control. The chosen image shows at once (a local preview)
 * while it uploads; on success the header's avatar follows, on failure the old one comes back.
 */
export function AvatarUploader({ profile, name }: { profile: CustomerProfileResponse; name: string }) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updated) => {
      setAccountProfile(updated);
      queryClient.setQueryData(customerKeys.me(), updated);
    },
    onError: (failure) => setError(failure.message || "تعذّر رفع الصورة حالياً."),
    onSettled: () =>
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      }),
  });

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkFile(file);
    setError(problem);
    if (problem) return;
    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar
          name={name}
          src={preview ?? profile.avatar_url}
          size={112}
          className={cn("text-4xl ring-4 ring-surface", upload.isPending && "opacity-60")}
        />
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={choose}
          disabled={upload.isPending}
          className="peer sr-only"
        />
        {/* The hidden input keeps focus; the camera button shows it. */}
        <label
          htmlFor={inputId}
          className="absolute -end-1 bottom-1 grid size-10 cursor-pointer place-items-center rounded-full border-2 border-surface bg-fg text-surface shadow-md transition-transform peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:scale-105"
        >
          <Camera aria-hidden="true" className="size-5 fill-none" />
          <span className="sr-only">تغيير الصورة الشخصية</span>
        </label>
      </div>
      <p aria-live="polite" className="m-0 min-h-5 text-center text-sm text-fg-muted">
        {upload.isPending ? "جارٍ رفع الصورة…" : upload.isSuccess ? "تم تحديث صورتك." : "PNG أو JPG أو WebP، حتى 5 ميجابايت"}
      </p>
      {error ? (
        <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
