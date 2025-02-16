import { app, shell, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { join } from "path";
import { exec } from "child_process";

function parseMenuItems(stdout) {
  try {
    const menuItems = stdout
      .trim()
      .split(",")
      .map((item) => {
        const [name, shortcut, icon] = item.split(": ");
        return {
          name: name.trim(),
          shortcut: shortcut ? shortcut.trim() : "No Shortcut",
          icon: icon ? icon.trim() : "No Icon",
        };
      });

    return menuItems
      .filter((item) => item.name !== "shortcut:" && item.name !== "icon:")
      .map((item) => ({
        name: item.name,
        shortcut: convertShortcutToUnicode(item.shortcut),
        icon:
          item.icon === "No Icon"
            ? "No Icon"
            : convertShortcutToUnicode(item.icon),
      }));
  } catch (error) {
    console.error("메뉴 항목 파싱 중 오류 발생:", error);
    return [];
  }
}

function getActiveApp() {
  return new Promise((resolve, reject) => {
    const activeAppScript = `
      tell application "System Events"
        try
          set activeApp to name of first process whose frontmost is true
          return activeApp
        on error
          return "No Active App"
        end try
      end tell
    `;
    exec(`osascript -e '${activeAppScript}'`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("AppleScript 오류 발생:", error || stderr);
        reject("활성 앱 확인 오류: " + stderr || error);
        return;
      }

      const activeApp = stdout.trim();
      if (!activeApp || activeApp === "No Active App") {
        reject("활성화된 앱을 찾을 수 없습니다.");
      } else {
        resolve(activeApp);
      }
    });
  });
}

function getMacMenuBarInfo(activeApp) {
  return new Promise((resolve, reject) => {
    const appleScript = `
      tell application "System Events"
          tell process "${activeApp}"
              set menuItems to {}
              try
                set menuBarItems to menu bar items of menu bar 1
                repeat with menuItem in menuBarItems
                    set menuItemName to name of menuItem
                    set subMenuItems to menu items of menu 1 of menuItem
                    repeat with subItem in subMenuItems
                        set subItemName to name of subItem
                        set subItemShortcut to ""
                        try
                          set subItemShortcut to accelerator of subItem
                        end try
                        set subItemIcon to "No Icon"
                        try
                          set subItemIcon to image of subItem
                        on error
                          set subItemIcon to "No Icon"
                        end try
                        set end of menuItems to {name: (menuItemName & " > " & subItemName), shortcut: subItemShortcut, icon: subItemIcon}
                    end repeat
                end repeat
              on error errMsg
                return "Error: " & errMsg
              end try
              return menuItems
          end tell
      end tell
    `;
    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("AppleScript 실행 중 오류 발생:", stderr || error);
        reject(new Error("AppleScript 실행 중 오류 발생: " + stderr || error));
        return;
      }
      const menuItems = parseMenuItems(stdout);
      if (!menuItems || menuItems.length === 0) {
        reject("메뉴 항목을 가져오지 못했습니다.");
      } else {
        resolve(menuItems);
      }
    });
  });
}

function convertShortcutToUnicode(shortcut) {
  const iconUnicodeMap = {
    "⌘": "U+2318",
    "⇧": "U+21E7",
    "⌥": "U+2325",
    "⌃": "U+2303",
    "⌫": "U+232B",
    fn: "U+F170",
    ArrowUp: "U+2191",
    ArrowDown: "U+2193",
    ArrowLeft: "U+2190",
    ArrowRight: "U+2192",
  };

  if (shortcut === "No Shortcut") return "No Shortcut";
  return shortcut
    .split("+")
    .map((key) => key.trim())
    .map(
      (key) =>
        iconUnicodeMap[key] ||
        `U+${key.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .join(" + ");
}

function setupIpcHandlers() {
  if (!ipcMain.listenerCount("get-menu-info")) {
    ipcMain.handle("get-menu-info", async (_, activeApp) => {
      try {
        return await getMacMenuBarInfo(activeApp);
      } catch (error) {
        console.error("메뉴 정보를 가져오기 실패:", error);
        throw error;
      }
    });
  }

  if (!ipcMain.listenerCount("get-active-app")) {
    ipcMain.handle("get-active-app", async () => {
      try {
        return await getActiveApp();
      } catch (error) {
        console.error("활성화된 앱 확인 실패:", error);
        throw error;
      }
    });
  }
}

function setupKeyboardListeners() {
  globalShortcut.register("Tab", async () => {
    try {
      const activeApp = await getActiveApp();
      const menuItems = await getMacMenuBarInfo(activeApp);
      console.log("현재 활성화된 앱 메뉴 항목:", menuItems);
    } catch (error) {
      console.error("Tab 키 입력 중 오류 발생:", error);
    }
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.js"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
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

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
  setupKeyboardListeners();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
