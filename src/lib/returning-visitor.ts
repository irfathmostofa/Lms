export const RETURNING_VISITOR_KEY = 'lms.returningVisitor';

export function hasVisitedBefore() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(RETURNING_VISITOR_KEY) === '1';
  } catch {
    return false;
  }
}

export function markVisited() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RETURNING_VISITOR_KEY, '1');
  } catch {
    // Ignore storage failures in private browsing.
  }
}
