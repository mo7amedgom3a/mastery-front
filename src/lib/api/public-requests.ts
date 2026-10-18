import "server-only";

import { apiRequest } from "@/lib/api/client";

export type TrainerApplicationDto = {
  specialized: string;
  programs: string;
  title: string;
  name: string;
  email: string;
  mobile: string;
  nationality: string;
  youtube: boolean;
  instagram: boolean;
  facebook: boolean;
  youtubechannel: string | null;
  instagramprofile: string | null;
  facebookpage: string | null;
  country: string;
  city: string;
  birthdate: string;
  educationalLevel: string;
  major: string;
  totalYearsOfExperience: string;
  scopedExperience: string;
  languages: string;
  additionalServices: string;
  personalProgram: string;
  consultancy: boolean;
  cvUrl: string;
  recorded: boolean;
};

export type CompanyTrainingRequestDto = {
  companyName: string;
  contactName: string;
  companyEmail: string;
  contactPhone: string;
  jobTitle: string;
  companyRange: string;
  country: string;
  city: string;
};

async function submit(path: string, body: unknown): Promise<boolean> {
  try {
    await apiRequest("POST", path, {
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return true;
  } catch (error) {
    console.error(`[public-requests] POST ${path} failed`, error);
    return false;
  }
}

export function submitTrainerApplication(dto: TrainerApplicationDto): Promise<boolean> {
  return submit("/api/v1/requests/trainer-applications", dto);
}

export function submitCompanyTrainingRequest(dto: CompanyTrainingRequestDto): Promise<boolean> {
  return submit("/api/v1/requests/company-training", dto);
}
