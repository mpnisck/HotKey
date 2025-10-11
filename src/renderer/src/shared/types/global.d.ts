/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  interface Window {
    api: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;
    };
  }
}

export {};
