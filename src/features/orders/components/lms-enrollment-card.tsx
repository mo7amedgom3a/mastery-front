import { CalendarCheck, CalendarX, GraduationCap, Infinity as Lifetime, PlayCircle, UserRound } from "lucide-react";
import Image from "next/image";

import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { ContinueLearningButton } from "@/features/student-dashboard/components/continue-learning-button";
import { safeLmsImage } from "@/features/student-dashboard/model/learning";
import type { LmsEnrollment } from "@/lib/api/lms";
import { formatDate } from "@/lib/format";

import { entitlementStatus } from "../model/status";
import { StatusTag } from "./status-tag";

const CARD_SIZES = "(min-width: 1200px) 320px, (min-width: 600px) 50vw, 100vw";

/**
 * A course the LMS enrolled the student in that has no B2C purchase behind it (most often from before
 * this site). «كمّل التعلّم» opens it by its LMS id; the backend checks the enrollment in the LMS.
 */
export function LmsEnrollmentCard({ enrollment, index = 0 }: { enrollment: LmsEnrollment; index?: number }) {
  const image = safeLmsImage(enrollment.image_url);
  const typeLabel = enrollment.is_diploma ? "دبلومة" : "دورة";
  const TypeIcon = enrollment.is_diploma ? GraduationCap : PlayCircle;
  const title = enrollment.title ?? `${typeLabel} من منصة التعلّم`;

  return (
    <article className="ma-card relative h-full">
      <div className={`ma-card__media relative grid place-items-center overflow-hidden p-0 ${brandBg[brandColorAt(index)]}`}>
        {image ? (
          <Image src={image} alt="" fill sizes={CARD_SIZES} className="object-cover" />
        ) : (
          <TypeIcon aria-hidden="true" className="size-12 fill-none text-ink" strokeWidth={1.5} />
        )}
        <span className="ma-tag ma-tag--cream absolute start-4 top-4 z-10">{typeLabel}</span>
      </div>
      <div className="ma-card__body">
        <div className="flex flex-wrap gap-2">
          <StatusTag status={entitlementStatus("active")} />
          <span className="ma-tag ma-tag--soft">من منصة التعلّم</span>
        </div>
        <h3 className="ma-card__title line-clamp-2">{title}</h3>
        {enrollment.trainer ? (
          <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
            <UserRound aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
            <bdi className="truncate">{enrollment.trainer}</bdi>
          </p>
        ) : null}
        <dl className="m-0 mt-auto grid gap-2 text-sm">
          {enrollment.enrolled_at ? (
            <div className="flex items-center gap-2">
              <CalendarCheck aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
              <dt className="text-fg-muted">يبدأ الوصول</dt>
              <dd className="m-0 font-bold">{formatDate(enrollment.enrolled_at)}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            {enrollment.expires_at ? (
              <CalendarX aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
            ) : (
              <Lifetime aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
            )}
            <dt className="text-fg-muted">ينتهي الوصول</dt>
            <dd className="m-0 font-bold">
              {enrollment.expires_at ? formatDate(enrollment.expires_at) : "وصول مدى الحياة"}
            </dd>
          </div>
        </dl>
      </div>
      <div className="ma-card__foot">
        <ContinueLearningButton lmsCourseId={enrollment.lms_course_id} title={title} />
      </div>
    </article>
  );
}
