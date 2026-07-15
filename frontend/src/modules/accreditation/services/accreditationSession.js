let pendingConnection = null;

/**
 * Shares the demo-to-backend bridge between the layout and the active page.
 * Real backend sessions resolve immediately without creating extra work.
 */
export function ensureAccreditationBackendSession(auth) {
  if (!String(auth.token || "").startsWith("demo-token")) {
    return Promise.resolve(true);
  }

  if (!pendingConnection) {
    pendingConnection = Promise.resolve(auth.connectDemoToBackend()).finally(
      () => {
        pendingConnection = null;
      },
    );
  }

  return pendingConnection;
}
