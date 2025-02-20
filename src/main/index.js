import { app, shell, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { join } from "path";
import { exec } from "child_process";

// 메뉴 항목 파싱 함수
function parseMenuItems(stdout) {
  try {
    const items = stdout.trim().split(",");
    const menuItems = [];

    for (let i = 0; i < items.length; i += 2) {
      if (items[i] && items[i + 1]) {
        const name = items[i].trim();
        const shortcut = items[i + 1].trim();

        if (name.startsWith("name:")) {
          menuItems.push({
            name: name.replace(/^name:/, ""),
            shortcut: shortcut.replace(/^shortcut:/, ""),
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

// 활성 앱 가져오기
function getActiveApp() {
  return new Promise((resolve, reject) => {
    const activeAppScript = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        return name of frontApp
      end tell`;

    exec(
      `osascript -e "${activeAppScript.replace(/"/g, '\\"')}"`,
      (error, stdout) => {
        if (error) {
          console.error("활성 앱 확인 오류:", error.message); // 오류 로그 추가
          reject(new Error(`활성 앱 확인 오류: ${error.message}`));
          return;
        }

        const activeApp = stdout.trim();
        if (!activeApp) {
          console.error("활성화된 앱을 찾을 수 없습니다."); // 로그 추가
          reject(new Error("활성화된 앱을 찾을 수 없습니다."));
        } else {
          console.log("현재 활성화된 앱:", activeApp); // 활성 앱 로그 추가
          resolve(activeApp);
        }
      }
    );
  });
}

// 메뉴바 정보 가져오기
function getMacMenuBarInfo(activeApp) {
  return new Promise((resolve, reject) => {
    if (!activeApp || typeof activeApp !== "string") {
      reject(new Error("활성 앱 이름이 유효하지 않습니다."));
      return;
    }

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
          console.log("파싱된 메뉴 아이템:", menuItems);
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

// IPC 핸들러 설정
function setupIpcHandlers() {
  ipcMain.handle("get-menu-info", async (_, activeApp) => {
    if (!activeApp) {
      throw new Error("활성 앱 이름이 제공되지 않았습니다.");
    }
    return await getMacMenuBarInfo(activeApp);
  });

  ipcMain.handle("get-active-app", async () => {
    const activeApp = await getActiveApp();
    if (!activeApp) {
      throw new Error("활성화된 앱을 찾을 수 없습니다.");
    }
    return activeApp;
  });
}

// 키보드 리스너 설정
function setupKeyboardListeners() {
  globalShortcut.register("Tab", async () => {
    try {
      const activeApp = await getActiveApp();
      if (!activeApp) {
        console.error("활성화된 앱을 찾을 수 없습니다.");
        return;
      }
      const menuItems = await getMacMenuBarInfo(activeApp);
      console.log("현재 활성화된 앱:", activeApp);
      console.log("메뉴 항목:", menuItems);
    } catch (error) {
      console.error("Tab 키 입력 중 오류 발생:", error);
    }
  });
}

// 메인 윈도우 생성
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 930,
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

// 앱 초기화
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
