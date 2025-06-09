// Pushes rebuttal_app and ipc into global scope to allow us to avoid the type checker complaints
import { RebuttalApp } from "./types";
export { };
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipc: any,
    rebuttal_app: RebuttalApp,
  }
}
