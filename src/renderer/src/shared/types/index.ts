export interface MenuItem {
  name: string;
  shortcut?: string;
}

export interface MenuData {
  [category: string]: MenuItem[];
}

export interface GlobalKeyStateData {
  key: string;
  pressed: boolean;
}

export interface GlobalKeyActivatedData {
  activated: boolean;
  appName?: string;
}

export type GlobalKeyProgress = number;

export interface IPCChannels {
  "global-key-state": GlobalKeyStateData;
  "global-key-progress": GlobalKeyProgress;
  "global-key-activated": GlobalKeyActivatedData;
  "get-active-app": void;
  "get-menu-items": string;
}
