import { app, shell, BrowserWindow, ipcMain, globalShortcut } from "electron";
import { join } from "path";
import { exec } from "child_process";

interface MenuItem {
  name: string;
  shortcut: string;
}

let mainWindow: BrowserWindow | null = null;

function getActiveApp(): Promise<string> {
  return new Promise((resolve, reject) => {
    const activeAppScript = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        if frontApp is not missing value then
          return name of frontApp
        else
          return ""
        end if
      end tell`;

    exec(
      `osascript -e "${activeAppScript.replace(/"/g, '\\"')}"`,
      (error, stdout) => {
        if (error) {
          console.error("활성 앱 확인 오류:", error.message);
          reject(new Error(`활성 앱 확인 오류: ${error.message}`));
          return;
        }

        const activeApp = stdout.trim();
        if (!activeApp) {
          reject(new Error("활성화된 앱을 찾을 수 없습니다."));
        } else {
          resolve(activeApp);
        }
      }
    );
  });
}

function getMacMenuBarInfo(processName: string): Promise<MenuItem[]> {
  return new Promise((resolve, reject) => {
    const safeProcessName = String(processName || "").replace(/'/g, "'\\''");

    const appleScript = `
tell application "System Events"
  tell process "${safeProcessName}"
    set results to {}
    repeat with mb in menu bar items of menu bar 1
      set mbName to name of mb
      try
        repeat with mi in menu items of menu 1 of mb
          set miName to name of mi
          if miName is not missing value and miName is not "" then
            set sc to ""
            try
              set cmdKey to value of attribute "AXMenuItemCmdKey" of mi
              if cmdKey is not missing value then set sc to cmdKey
            end try
            if sc is "" then
              try
                set cmdChar to value of attribute "AXMenuItemCmdChar" of mi
                if cmdChar is not missing value and cmdChar is not "" then
                  set mods to ""
                  set modVal to value of attribute "AXMenuItemCmdModifiers" of mi
                  if modVal is not missing value then
                    set m to modVal as number
                    if m mod 2 = 1 then set mods to mods & "⇧"
                    if (m div 2) mod 2 = 1 then set mods to mods & "⌥"
                    if (m div 4) mod 2 = 1 then set mods to mods & "⌃"
                    if (m div 8) mod 2 = 0 then set mods to mods & "⌘"
                  end if
                  set sc to mods & cmdChar
                end if
              end try
            end if
            if sc is not "" then
              set end of results to mbName & " > " & miName & "|" & sc
            end if
          end if
        end repeat
      end try
    end repeat
    return results
  end tell
end tell`;

    exec(`osascript -e '${appleScript}'`, (error, stdout) => {
      if (error) {
        reject(new Error(error.message));
        return;
      }
      const items = stdout
        .trim()
        .split(", ")
        .filter(Boolean)
        .map((item) => {
          const parts = item.split("|");
          return {
            name: parts[0]?.trim() || "",
            shortcut: parts[1]?.trim() || "",
          };
        })
        .filter((item) => item.name && item.shortcut);
      resolve(items);
    });
  });
}

function setupIpcHandlers(): void {
  ipcMain.handle("get-menu-info", async (_event, appName?: string) => {
    try {
      const activeApp = appName || (await getActiveApp());
      if (!activeApp) {
        throw new Error("활성 앱 이름이 제공되지 않았습니다.");
      }
      return await getMacMenuBarInfo(activeApp);
    } catch (error) {
      console.error("get-menu-info 오류:", error);
      throw error;
    }
  });

  ipcMain.handle("get-active-app", async () => {
    try {
      const activeApp = await getActiveApp();
      if (!activeApp) {
        throw new Error("활성화된 앱을 찾을 수 없습니다.");
      }
      return activeApp;
    } catch (error) {
      console.error("get-active-app 오류:", error);
      throw error;
    }
  });
}

function fadeInWindow(window: BrowserWindow): void {
  let opacity = 0;
  window.setOpacity(opacity);

  const interval = setInterval(() => {
    if (opacity >= 1) {
      clearInterval(interval);
    } else {
      opacity += 0.05;
      window.setOpacity(opacity);
    }
  }, 10);
}

function fadeOutWindow(window: BrowserWindow): void {
  let opacity = 1;
  window.setOpacity(opacity);

  const interval = setInterval(() => {
    if (opacity <= 0) {
      clearInterval(interval);
      window.hide();
    } else {
      opacity -= 0.05;
      window.setOpacity(opacity);
    }
  }, 10);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    x: -0,
    y: -0,
    frame: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.js"),
      devTools: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      fadeInWindow(mainWindow);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function toggleWindow(): void {
  if (!mainWindow) {
    createWindow();
  } else {
    if (mainWindow.isVisible()) {
      fadeOutWindow(mainWindow);
    } else {
      mainWindow.show();
      mainWindow.focus();
      fadeInWindow(mainWindow);
    }
  }
}

function setupGlobalShortcut(): void {
  globalShortcut.register("Command+1", toggleWindow);
  globalShortcut.register("Option+1", toggleWindow);
  globalShortcut.register("Shift+1", toggleWindow);
}

const openSecuritySet = (): void => {
  shell.openExternal(
    "x-apple.systempreferences:com.apple.preference.security?Privacy"
  );
};

app.whenReady().then(() => {
  createWindow();
  setupGlobalShortcut();
  setupIpcHandlers();
  openSecuritySet();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
