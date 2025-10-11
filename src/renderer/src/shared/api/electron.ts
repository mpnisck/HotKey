import { MenuItem } from "../types";

export const electronApi = {
  getMenuInfo: async (appName?: string): Promise<MenuItem[]> => {
    return window.api.invoke("get-menu-info", appName);
  },

  getActiveApp: async (): Promise<string> => {
    return window.api.invoke("get-active-app");
  },
};
