import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { exec } from "child_process";

const specialKeyMap = {
  Cmd: "⌘",
  Option: "⌥",
  Shift: "⇧",
  Control: "⌃",
  Esc: "⎋",
  Return: "⏎",
  Delete: "⌫",
  Space: "␣",
};

function mapSpecialKeys(shortcut) {
  for (let key in specialKeyMap) {
    shortcut = shortcut.replace(new RegExp(key, "g"), specialKeyMap[key]);
  }

  shortcut = shortcut.replace(/Cmd\s?\+?\s?/g, "⌘");
  shortcut = shortcut.replace(/Option\s?\+?\s?/g, "⌥");
  shortcut = shortcut.replace(/Shift\s?\+?\s?/g, "⇧");
  shortcut = shortcut.replace(/Control\s?\+?\s?/g, "⌃");

  return shortcut;
}
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
            -- 피그마의 메뉴바 항목을 가져옴
            set menuBarItems to menu bar items of menu bar 1
            repeat with menuItem in menuBarItems
                set menuItemName to name of menuItem
                -- 피그마의 각 메뉴에서 하위 메뉴 항목을 가져옴
                set subMenuItems to menu items of menu 1 of menuItem
                repeat with subItem in subMenuItems
                    set subItemName to name of subItem
                    set subItemShortcut to ""

                    try
                        -- 단축키 정보 추출
                        if exists (attribute "AXMenuItemCmdKey" of subItem) then
                            set subItemShortcut to value of attribute "AXMenuItemCmdKey" of subItem
                        end if

                        -- 단축키가 없다면, 모디파이어 키(⌘, ⇧, ⌥, ⌃)를 이용해 조합
                        if subItemShortcut is "" then
                            set shortcutModifiers to ""

                            -- 모디파이어 키에 대한 값 확인
                            if exists (attribute "AXMenuItemCmdModifiers" of subItem) then
                                set modValue to value of attribute "AXMenuItemCmdModifiers" of subItem
                                if modValue is not missing value then
                                    set modNum to modValue as number

                                    -- 각 모디파이어 키에 해당하는 특수기호 조합
                                    if (modNum div 1 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "Cmd"
                                    end if
                                    if (modNum div 2 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "Option"
                                    end if
                                    if (modNum div 4 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "Shift"
                                    end if
                                    if (modNum div 8 mod 2 is 1) then
                                        set shortcutModifiers to shortcutModifiers & "Control"
                                    end if
                                end if
                            end if

                            -- 명령 문자와 모디파이어 키 결합
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

                    -- 메뉴 항목과 단축키가 있으면 목록에 추가
                    if subItemShortcut is not "" then
                        set end of menuItems to {name:menuItemName & " > " & subItemName, shortcut:subItemShortcut}
                    end if
                end repeat
            end repeat
            -- 피그마 메뉴 항목과 단축키 목록 반환
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
          reject(new Error(`AppleScript 실행 오류: ${error.message}`));
          return;
        }

        if (stderr) {
          reject(new Error(stderr));
          return;
        }

        try {
          const menuItems = parseMenuItems(stdout);
          resolve(menuItems);
        } catch (parseError) {
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
            shortcut: mapSpecialKeys(
              shortcut.replace(/^shortcut:/, "").trim() || "없음"
            ),
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
      return await getMacMenuBarInfo();
    } catch (error) {
      console.error("get-menu-info 오류:", error);
      throw error;
    }
  });

  ipcMain.handle("get-active-app", async () => {
    try {
      return await getActiveApp();
    } catch (error) {
      console.error("get-active-app 오류:", error);
      throw error;
    }
  });
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
  });

  mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
