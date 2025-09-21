import { app, shell, BrowserWindow, ipcMain, globalShortcut } from "electron";
import { join } from "path";
import { exec } from "child_process";

interface MenuItem {
  name: string;
  shortcut: string;
}

let mainWindow: BrowserWindow | null = null;

function isValidMenuItem(name: string): boolean {
  return name !== "" && !name.includes("비활성화된");
}

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
    const safeProcessName = String(processName || "").replace(/"/g, '\\"');
    const appleScript = `
tell application "System Events"
    tell process "${safeProcessName}"
        set menuItems to {}
        set menuBarItems to menu bar items of menu bar 1
        repeat with menuItem in menuBarItems
            set menuItemName to name of menuItem
            set subMenuItems to menu items of menu 1 of menuItem
            repeat with subItem in subMenuItems
                set subItemName to name of subItem
                set subItemShortcut to ""

                -- 모든 단축키 정보를 조합하여 가져오기
                set shortcutModifiers to ""
                set commandChar to ""

                -- 먼저 AXMenuItemCmdKey 확인 (전체 단축키)
                if exists (attribute "AXMenuItemCmdKey" of subItem) then
                    set fullKey to value of attribute "AXMenuItemCmdKey" of subItem
                    if fullKey is not missing value and fullKey is not "" then
                        set subItemShortcut to fullKey
                    end if
                end if

                -- AXMenuItemCmdKey가 없거나 비어있으면 개별 구성요소로 조합
                if subItemShortcut is "" then
                    if exists (attribute "AXMenuItemCmdModifiers" of subItem) then
                        set modValue to value of attribute "AXMenuItemCmdModifiers" of subItem
                        if modValue is not missing value then
                            set modNum to modValue as number

                            -- 디버깅: 원본 값과 각 비트 상태 표시
                            set shortcutModifiers to "[" & (modNum as string) & ":"

                            -- Carbon/Cocoa EventModifiers 정확한 매핑 테스트
                            -- 다양한 비트 위치 확인
                            set bitResults to ""

                            -- 비트 0-15 확인
                            repeat with bitPos from 0 to 15
                                set bitValue to (modNum div (2 ^ bitPos)) mod 2
                                if bitValue = 1 then
                                    set bitResults to bitResults & bitPos & ","
                                end if
                            end repeat

                            set shortcutModifiers to shortcutModifiers & bitResults & "]"

                            -- 알려진 Carbon modifier 값들로 매핑
                            -- cmdKey = 256 (bit 8) = ⌘
                            -- shiftKey = 512 (bit 9) = ⇧
                            -- optionKey = 2048 (bit 11) = ⌥
                            -- controlKey = 4096 (bit 12) = ⌃

                            if ((modNum div 256) mod 2) = 1 then
                                set shortcutModifiers to shortcutModifiers & "⌘"
                            end if

                            if ((modNum div 512) mod 2) = 1 then
                                set shortcutModifiers to shortcutModifiers & "⇧"
                            end if

                            if ((modNum div 2048) mod 2) = 1 then
                                set shortcutModifiers to shortcutModifiers & "⌥"
                            end if

                            if ((modNum div 4096) mod 2) = 1 then
                                set shortcutModifiers to shortcutModifiers & "⌃"
                            end if

                            -- Function key 확인 (다양한 위치 테스트)
                            if ((modNum div 8192) mod 2) = 1 then
                                set shortcutModifiers to "fn" & shortcutModifiers
                            end if
                        end if
                    end if

                    if exists (attribute "AXMenuItemCmdChar" of subItem) then
                        set commandChar to value of attribute "AXMenuItemCmdChar" of subItem
                        if commandChar is not missing value and commandChar is not "" then
                            set subItemShortcut to shortcutModifiers & commandChar
                        end if
                    end if
                end if

                if subItemShortcut is not "" then
                    set end of menuItems to {name:menuItemName & " > " & subItemName, shortcut:subItemShortcut}
                end if
            end repeat
        end repeat
        return menuItems
    end tell
end tell
    `;

    exec(
      `osascript -e "${appleScript.replace(/"/g, '\\"')}"`,
      (error, stdout, stderr) => {
        if (error || stderr) {
          reject(new Error(error?.message || stderr));
          return;
        }

        try {
          const menuItems = parseMenuItems(stdout);
          resolve(menuItems);
        } catch (parseError) {
          reject(new Error(`메뉴 항목 파싱 중 오류 발생: ${parseError}`));
        }
      }
    );
  });
}

function processShortcut(shortcut: string): string {
  return shortcut.trim();
}

function parseMenuItems(stdout: string): MenuItem[] {
  try {
    const items = stdout.trim().split(",");
    const menuItems: MenuItem[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i] && items[i + 1]) {
        const name = items[i].trim();
        let shortcut = items[i + 1].trim();

        if (shortcut.startsWith("shortcut:")) {
          shortcut = shortcut.replace(/^shortcut:/, "").trim();
        }

        if (
          name.startsWith("name:") &&
          isValidMenuItem(name.replace(/^name:/, "").trim())
        ) {
          shortcut = processShortcut(shortcut);

          menuItems.push({
            name: name.replace(/^name:/, "").trim(),
            shortcut: shortcut || "없음",
          });
        }
      }
    }
    return menuItems;
  } catch (error) {
    console.error("메뉴 항목 파싱 중 오류 발생:", error);
    return [];
  }
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
