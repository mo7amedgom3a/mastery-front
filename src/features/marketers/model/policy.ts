import type { PolicySection } from "../components/policy-reader";

/** `GET /affiliates/policy`: the sections an applicant must read, and the version they accept. */
export type ProgramPolicy = { version: string; sections: PolicySection[] };
