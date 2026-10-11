/**
 * "Skip onboarding", remembered in this browser per customer. The backend has no field for it; the
 * dashboard keeps offering to complete the profile either way.
 */
const key = (customerId: string) => `mastery:onboarding-skipped:${customerId}`;

export function isOnboardingSkipped(customerId: string): boolean {
  try {
    return window.localStorage.getItem(key(customerId)) === "1";
  } catch {
    return false;
  }
}

export function skipOnboarding(customerId: string): void {
  try {
    window.localStorage.setItem(key(customerId), "1");
  } catch {
    // Storage blocked: the customer is asked again next time, which is harmless.
  }
}

export function clearOnboardingSkip(customerId: string): void {
  try {
    window.localStorage.removeItem(key(customerId));
  } catch {
    // Nothing to clear.
  }
}
