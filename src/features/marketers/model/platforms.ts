/** Accounts an applicant can link. Mirrors `MARKETING_PLATFORMS` in the backend affiliates domain. */
export const MARKETING_PLATFORMS = [
  { key: "instagram", label: "إنستغرام", question: "هل لديك حساب على إنستغرام؟", hosts: ["instagram.com"], example: "https://instagram.com/username" },
  { key: "tiktok", label: "تيك توك", question: "هل لديك حساب على تيك توك؟", hosts: ["tiktok.com"], example: "https://tiktok.com/@username" },
  { key: "x", label: "X (تويتر)", question: "هل لديك حساب على X (تويتر)؟", hosts: ["x.com", "twitter.com"], example: "https://x.com/username" },
  { key: "youtube", label: "يوتيوب", question: "هل لديك قناة على يوتيوب؟", hosts: ["youtube.com", "youtu.be"], example: "https://youtube.com/@channel" },
  { key: "snapchat", label: "سناب شات", question: "هل لديك حساب على سناب شات؟", hosts: ["snapchat.com"], example: "https://snapchat.com/add/username" },
  { key: "facebook", label: "فيسبوك", question: "هل لديك صفحة أو حساب على فيسبوك؟", hosts: ["facebook.com", "fb.com"], example: "https://facebook.com/page" },
  { key: "linkedin", label: "لينكدإن", question: "هل لديك حساب على لينكدإن؟", hosts: ["linkedin.com"], example: "https://linkedin.com/in/username" },
  { key: "telegram", label: "تيليجرام", question: "هل تدير قناة أو مجموعة على تيليجرام؟", hosts: ["t.me", "telegram.me"], example: "https://t.me/channel" },
  { key: "whatsapp", label: "واتساب", question: "هل تدير قناة أو مجموعة على واتساب؟", hosts: ["whatsapp.com", "wa.me"], example: "https://whatsapp.com/channel/..." },
  { key: "website", label: "موقع أو مدونة", question: "هل تدير موقعًا إلكترونيًا أو مدونة؟", hosts: null, example: "https://myblog.com" },
] as const;

export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number];
export type PlatformKey = MarketingPlatform["key"];

/** An error message for the link, or null when it is a valid link on the platform's domain. */
export function platformLinkError(platform: MarketingPlatform, raw: string): string | null {
  const value = raw.trim();
  if (!value) return `أضف رابط ${platform.label}`;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return "الرابط غير صحيح";
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  if (!host.includes(".")) return "الرابط غير صحيح";
  if (platform.hosts && !platform.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
    return `يجب أن يكون الرابط على ${platform.hosts[0]}`;
  }
  return null;
}
