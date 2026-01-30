import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  screen,
} from "electron";
import { join } from "path";
import { exec } from "child_process";
import { GlobalKeyboardListener } from "node-global-key-listener";

let globalKeyListener: GlobalKeyboardListener | null = null;

const LONG_PRESS_DURATION = 2000;
let commandPressStart: number | null = null;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let capturedActiveApp: string | null = null;

interface MenuItem {
  name: string;
  shortcut: string;
}

const specialKeySymbols = new Map<number, string>([
  [0x09, "⇥"],
  [0x08, "⌫"],
  [0x7f, "⌫"],
  [0x1b, "⎋"],
  [0x0d, "↩"],
  [0x1c, "←"],
  [0x1d, "→"],
  [0x1e, "↑"],
  [0x1f, "↓"],
]);

function normalizeShortcut(shortcut: string): string {
  let result = "";

  for (const char of shortcut) {
    const charCode = char.charCodeAt(0);
    const symbol = specialKeySymbols.get(charCode);
    result += symbol ?? char;
  }

  return result;
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
          reject(new Error(error.message));
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
                    try
                      set vkVal to value of attribute "AXMenuItemCmdVirtualKey" of mi
                      if vkVal is not missing value then
                        set vk to vkVal as number
                        if vk = 122 or vk = 120 or vk = 99 or vk = 118 or vk = 96 or vk = 97 or vk = 98 or vk = 100 or vk = 101 or vk = 109 or vk = 103 or vk = 111 then
                          set mods to mods & "🌐"
                        end if
                      end if
                    end try
                    if (m div 4) mod 2 = 1 then set mods to mods & "⌃"
                    if (m div 2) mod 2 = 1 then set mods to mods & "⌥"
                    if m mod 2 = 1 then set mods to mods & "⇧"
                    if (m div 8) mod 2 = 0 then set mods to mods & "⌘"
                  end if
                  set glyphChar to cmdChar
                  try
                    set glyphVal to value of attribute "AXMenuItemCmdGlyph" of mi
                    if glyphVal is not missing value then
                      if glyphVal = 2 then set glyphChar to "⇥"
                      if glyphVal = 4 then set glyphChar to "⌤"
                      if glyphVal = 9 then set glyphChar to "␣"
                      if glyphVal = 10 then set glyphChar to "⌦"
                      if glyphVal = 11 then set glyphChar to "↩"
                      if glyphVal = 23 then set glyphChar to "⌫"
                      if glyphVal = 27 then set glyphChar to "⎋"
                      if glyphVal = 28 then set glyphChar to "⌧"
                      if glyphVal = 98 then set glyphChar to "⇞"
                      if glyphVal = 100 then set glyphChar to "←"
                      if glyphVal = 101 then set glyphChar to "→"
                      if glyphVal = 104 then set glyphChar to "↑"
                      if glyphVal = 106 then set glyphChar to "↓"
                      if glyphVal = 107 then set glyphChar to "⇟"
                    end if
                  end try
                  set sc to mods & glyphChar
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
          const rawShortcut = parts[1]?.trim() || "";
          return {
            name: parts[0]?.trim() || "",
            shortcut: normalizeShortcut(rawShortcut),
          };
        })
        .filter((item) => item.name && item.shortcut);
      resolve(items);
    });
  });
}

function setupIpcHandlers(): void {
  ipcMain.handle("get-menu-info", async (_event, appName?: string) => {
    const activeApp = appName || (await getActiveApp());
    return await getMacMenuBarInfo(activeApp);
  });

  ipcMain.handle("get-active-app", async () => {
    return await getActiveApp();
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
    height: 735,
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

function clearLongPressTimer(): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  commandPressStart = null;
  capturedActiveApp = null;
  mainWindow?.webContents.send("global-key-progress", 0);
}

async function startLongPress(): Promise<void> {
  try {
    capturedActiveApp = await getActiveApp();
  } catch {
    capturedActiveApp = null;
  }

  commandPressStart = Date.now();

  progressInterval = setInterval(() => {
    if (commandPressStart) {
      const elapsed = Date.now() - commandPressStart;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      mainWindow?.webContents.send("global-key-progress", progress);
    }
  }, 50);

  longPressTimer = setTimeout(() => {
    clearInterval(progressInterval!);
    progressInterval = null;
    longPressTimer = null;
    commandPressStart = null;

    if (mainWindow) {
      const cursorPoint = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(cursorPoint);
      const windowBounds = mainWindow.getBounds();

      let x = cursorPoint.x - windowBounds.width / 2;
      let y = cursorPoint.y - 50;

      x = Math.max(
        display.bounds.x,
        Math.min(
          x,
          display.bounds.x + display.bounds.width - windowBounds.width
        )
      );
      y = Math.max(
        display.bounds.y,
        Math.min(
          y,
          display.bounds.y + display.bounds.height - windowBounds.height
        )
      );

      mainWindow.setPosition(Math.round(x), Math.round(y));
      mainWindow.show();
      mainWindow.focus();
      fadeInWindow(mainWindow);
      setTimeout(() => {
        mainWindow?.webContents.send("global-key-activated", {
          activated: true,
          appName: capturedActiveApp,
        });
        mainWindow?.webContents.send("global-key-progress", 0);
        capturedActiveApp = null;
      }, 100);
    }
  }, LONG_PRESS_DURATION);
}

function setupGlobalKeyListener(): void {
  try {
    globalKeyListener = new GlobalKeyboardListener();
  } catch {
    return;
  }

  let isCommandPressed = false;
  let otherKeyPressed = false;

  globalKeyListener.addListener((e) => {
    const key = e.name?.toUpperCase();
    const isDown = e.state === "DOWN";

    const isCommandKey =
      key === "LEFT META" ||
      key === "RIGHT META" ||
      key?.includes("META") ||
      key?.includes("CMD") ||
      key?.includes("COMMAND");

    if (isCommandKey) {
      if (isDown) {
        if (!isCommandPressed) {
          isCommandPressed = true;
          otherKeyPressed = false;
          mainWindow?.webContents.send("global-key-state", {
            key: "command",
            pressed: true,
          });
          startLongPress();
        }
      } else {
        isCommandPressed = false;
        mainWindow?.webContents.send("global-key-state", {
          key: "command",
          pressed: false,
        });
        clearLongPressTimer();
      }
      return;
    }

    const isMouseEvent = key?.includes("MOUSE");
    if (isDown && isCommandPressed && !otherKeyPressed && !isMouseEvent) {
      otherKeyPressed = true;
      clearLongPressTimer();
    }
  });
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
  setupGlobalKeyListener();
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
