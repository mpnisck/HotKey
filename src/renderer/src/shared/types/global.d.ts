/// <reference types="react" />
/// <reference types="react-dom" />

import type {
  MenuItem,
  GlobalKeyStateData,
  GlobalKeyActivatedData,
  GlobalKeyProgress,
} from "./index";

declare global {
  interface Window {
    api: {
      invoke(channel: "get-active-app"): Promise<string>;
      invoke(channel: "get-menu-items", appName: string): Promise<MenuItem[]>;
      on(
        channel: "global-key-state",
        func: (data: GlobalKeyStateData) => void
      ): () => void;
      on(
        channel: "global-key-progress",
        func: (data: GlobalKeyProgress) => void
      ): () => void;
      on(
        channel: "global-key-activated",
        func: (data: GlobalKeyActivatedData) => void
      ): () => void;
    };
  }
}

export {};
