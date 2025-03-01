import { app, shell, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { join } from "path";
import { exec } from "child_process";

function isValidMenuItem(name) {
  return name !== "" && !name.includes("비활성화된");
}

function getActiveApp() {
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

function getMacMenuBarInfo() {
  return new Promise((resolve, reject) => {
    const appleScript = `
tell application "System Events"
    tell process "Figma"
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
                        -- AXMenuItemCmdKey 속성을 사용하여 단축키 가져오기
                        if exists (attribute "AXMenuItemCmdKey" of subItem) then
                            set subItemShortcut to value of attribute "AXMenuItemCmdKey" of subItem
                        end if

                        -- 단축키가 없을 경우, 기존 방식으로 시도
                        if subItemShortcut is "" then
                            set shortcutModifiers to ""

                            if exists (attribute "AXMenuItemCmdModifiers" of subItem) then
                                set modValue to value of attribute "AXMenuItemCmdModifiers" of subItem
                                if modValue is not missing value then
                                    set modNum to modValue as number

                                    if (modNum div 1 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "⌘"
                                    end if
                                    if (modNum div 2 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "⌥"
                                    end if
                                    if (modNum div 4 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "⇧"
                                    end if
                                    if (modNum div 8 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "⌃"
                                    end if
                                end if
                            end if

                            if exists (attribute "AXMenuItemCmdChar" of subItem) then
                                set commandChar to value of attribute "AXMenuItemCmdChar" of subItem
                                if commandChar is not missing value then
                                    set subItemShortcut to shortcutModifiers & commandChar
                                end if
                            end if
                        end if

                    on error errMsg
                        log "Error retrieving shortcut for " & subItemName & ": " & errMsg
                    end try

                    if subItemShortcut is not "" then
                        set end of menuItems to {name:menuItemName & " > " & subItemName, shortcut:subItemShortcut}
                    end if
                end repeat
            end repeat
            return menuItems
        on error errMsg
            return "Error: " & errMsg
        end try
    end tell
end tell
    `;

    exec(
      `osascript -e "${appleScript.replace(/"/g, '\\"')}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error("AppleScript 실행 오류:", error);
          reject(new Error(`AppleScript 실행 중 오류 발생: ${error.message}`));
          return;
        }

        if (stderr) {
          console.error("AppleScript 오류:", stderr);
          reject(new Error(stderr));
          return;
        }

        try {
          const menuItems = parseMenuItems(stdout);
          resolve(menuItems);
        } catch (parseError) {
          console.error("메뉴 아이템 파싱 오류:", parseError);
          reject(
            new Error(`메뉴 항목 파싱 중 오류 발생: ${parseError.message}`)
          );
        }
      }
    );
  });
}

function parseMenuItems(stdout) {
  try {
    const items = stdout.trim().split(",");
    const menuItems = [];

    for (let i = 0; i < items.length; i += 2) {
      if (items[i] && items[i + 1]) {
        const name = items[i].trim();
        const shortcut = items[i + 1].trim();

        if (
          name.startsWith("name:") &&
          isValidMenuItem(name.replace(/^name:/, "").trim())
        ) {
          menuItems.push({
            name: name.replace(/^name:/, "").trim(),
            shortcut: shortcut.replace(/^shortcut:/, "").trim() || "없음",
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

function setupIpcHandlers() {
  ipcMain.handle("get-menu-info", async () => {
    try {
      const activeApp = await getActiveApp();
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

function setupKeyboardListeners() {
  globalShortcut.register("Tab", async () => {
    try {
      const activeApp = await getActiveApp();
      console.log("이것은 메인의 활성화된 앱: ", activeApp);

      if (!activeApp) {
        console.error("활성화된 앱을 찾을 수 없습니다.");
        return;
      }
      const menuItems = await getMacMenuBarInfo(activeApp);

      if (menuItems) {
        return menuItems;
      }
    } catch (error) {
      console.error("Tab 키 입력 중 오류 발생:", error);
    }
  });
}

function slideInWindow(mainWindow) {
  let x = -800;
  const targetX = 0;
  const interval = setInterval(() => {
    if (x >= targetX) {
      clearInterval(interval);
    } else {
      x += 10;
      mainWindow.setBounds({ x, y: 0, width: 610, height: 940 });
    }
  }, 6);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 610,
    height: 940,
    x: 0,
    y: 0,
    frame: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.js"),
      devTools: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    slideInWindow(mainWindow);
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
