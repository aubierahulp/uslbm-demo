export type BuildInfo = {
  appVersion: string | null;
  runtimeVersion: string | null;
  channel: string | null;
  /** null when the app runs the bundle embedded in the binary */
  updateId: string | null;
};
