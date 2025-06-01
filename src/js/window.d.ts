// This file should augment the properties of the `Window` with the type of the
// `ContextBridgeApi` from `Electron.contextBridge` declared in `src/preload.ts`.
export {};
declare global {
  interface Window {
    ipc: any
  }
}
