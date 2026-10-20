export async function uploadTrainerAttachment(file: File, kind: "cv" | "portfolio"): Promise<string> {
  const intent = await fetch("/api/b2c/requests/trainer-attachments/presign", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, content_type: file.type, size_bytes: file.size, kind }),
  });
  if (!intent.ok) throw new Error("تعذّر تجهيز الملف. تأكد من نوعه وحجمه (15 MB كحد أقصى).");
  const { attachment_id, token, upload_url } = await intent.json() as {
    attachment_id: string; token: string; upload_url: string;
  };
  const upload = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!upload.ok) throw new Error("تعذّر رفع الملف. حاول مرة أخرى.");
  const confirm = await fetch(`/api/b2c/requests/trainer-attachments/${attachment_id}/confirm`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
  });
  if (!confirm.ok) throw new Error("تعذّر تأكيد الملف. حاول مرة أخرى.");
  return attachment_id;
}
