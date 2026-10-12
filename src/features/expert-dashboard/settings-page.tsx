"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  consultationKeys,
  consultationQueries,
  updateExpertProfile,
  type ExpertProfileResponse,
} from "@/lib/api/consultations";
import { toPlainText } from "@/lib/format";

const SESSION_LENGTHS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

/** The expert's public name, bio and the length of one session (shared by all their consultations). */
export function ExpertSettingsPage() {
  const profile = useQuery(consultationQueries.expert());
  if (!profile.isSuccess) return <Skeleton className="h-64" />;
  return <SettingsForm profile={profile.data} />;
}

function SettingsForm({ profile }: { profile: ExpertProfileResponse }) {
  const queryClient = useQueryClient();
  const ids = { name: useId(), bio: useId(), length: useId() };
  const [name, setName] = useState(profile.display_name ?? "");
  // Bios imported from the old platform are HTML; the editor works in plain text.
  const [initialBio] = useState(() => toPlainText(profile.bio, 4000) ?? "");
  const [bio, setBio] = useState(initialBio);
  const [length, setLength] = useState(profile.session_minutes);
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      // Only what changed is sent, so an untouched imported bio keeps its formatting.
      updateExpertProfile({
        display_name: name.trim() && name.trim() !== profile.display_name ? name.trim() : null,
        bio: bio.trim() !== initialBio.trim() ? bio.trim() : null,
        session_minutes: length !== profile.session_minutes ? length : null,
      }),
    onSuccess: () => setSaved(true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    save.mutate();
  };
  const lengths = SESSION_LENGTHS.includes(profile.session_minutes)
    ? SESSION_LENGTHS
    : [...SESSION_LENGTHS, profile.session_minutes].sort((a, b) => a - b);

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
      <p className="m-0 text-sm text-fg-muted" dir="ltr">
        {profile.email}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.name} className="text-sm font-bold">
          الاسم الظاهر للعملاء
        </label>
        <input
          id={ids.name}
          maxLength={200}
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-panel border border-line bg-surface p-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.bio} className="text-sm font-bold">
          نبذة عنك
        </label>
        <textarea
          id={ids.bio}
          rows={6}
          maxLength={4000}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="rounded-panel border border-line bg-surface p-3"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.length} className="text-sm font-bold">
          مدة الجلسة الواحدة
        </label>
        <select
          id={ids.length}
          value={length}
          onChange={(event) => setLength(Number(event.target.value))}
          className="w-40 rounded-panel border border-line bg-surface p-2"
        >
          {lengths.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} دقيقة
            </option>
          ))}
        </select>
        <p className="m-0 text-xs leading-5 text-fg-muted">
          تسري على كل استشاراتك ومواعيدك. لتغييرها احذف مواعيدك القادمة أولاً وأنهِ الحجوزات النشطة.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={save.isPending} className="ma-btn ma-btn--primary ma-btn--sm disabled:opacity-50">
          حفظ
        </button>
        {saved ? (
          <p role="status" className="m-0 text-sm text-fg-muted">
            حُفظت التغييرات.
          </p>
        ) : null}
      </div>
      {save.isError ? (
        <p role="alert" className="m-0 text-sm text-fg-muted">
          {save.error instanceof ApiError && save.error.status === 409
            ? "لا يمكن تغيير مدة الجلسة ولديك مواعيد قادمة أو حجوزات نشطة. احذف المواعيد القادمة من التقويم أولاً."
            : "تعذّر الحفظ. تحقّق من الحقول وحاول مجدداً."}
        </p>
      ) : null}
    </form>
  );
}
