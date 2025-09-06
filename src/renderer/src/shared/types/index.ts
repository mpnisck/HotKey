export interface MenuItem {
  name: string;
  shortcut?: string;
}

export interface MenuData {
  [category: string]: MenuItem[];
}
