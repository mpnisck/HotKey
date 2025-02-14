import { app, shell, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { join } from "path";
import { exec } from "child_process";

let lastActiveApp = "";

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

ipcMain.handle("get-menu-info", async () => {
  try {
    const activeApp = lastActiveApp || "Finder";
    const menuItems = await getMacMenuBarInfo(activeApp);
    return menuItems;
  } catch (error) {
    console.log("메뉴 정보를 가져오기 실패:", error);
    return { error: "메뉴 정보 가져오기 실패" };
  }
});

function getMacMenuBarInfo(activeApp) {
  return new Promise((resolve, reject) => {
    const appleScript = `  
      tell application "System Events"  
          tell process "${activeApp}"  
              set menuItems to {}  
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
              return menuItems  
          end tell  
      end tell  
    `;

    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`AppleScript 실행 오류: ${error || stderr}`);
        reject(new Error("AppleScript 실행 중 오류 발생"));
        return;
      }

      const menuItems = parseMenuItems(stdout);
      resolve(menuItems);
    });
  });
}

function parseMenuItems(stdout) {
  return stdout
    .trim()
    .split(",")
    .map((item) => {
      const [name, shortcut, icon] = item.split(": ");
      return {
        name: name.trim(),
        shortcut: shortcut ? shortcut.trim() : "No Shortcut",
        icon: icon ? icon.trim() : "No Icon",
      };
    })
    .map((item) => ({
      name: item.name,
      shortcut: convertShortcutToUnicode(item.shortcut),
      icon:
        item.icon === "No Icon"
          ? "No Icon"
          : convertShortcutToUnicode(item.icon),
    }));
}

function convertShortcutToUnicode(shortcut) {
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

function checkActiveApp() {
  const activeAppScript = `  
    tell application "System Events"  
        set activeApp to name of first process whose frontmost is true  
        return activeApp  
    end tell  
  `;

  exec(`osascript -e '${activeAppScript}'`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(`활성 앱 확인 오류: ${error || stderr}`);
      return;
    }

    const currentActiveApp = stdout.trim();
    if (currentActiveApp && currentActiveApp !== lastActiveApp) {
      lastActiveApp = currentActiveApp;
    }
  });
}

function setupKeyboardListeners() {
  globalShortcut.register("Tab", () => {
    console.log("Tab 키 입력 감지");
    checkActiveApp();
  });

  globalShortcut.register("Return", () => {
    console.log("Enter 키 입력 감지");
    checkActiveApp();
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
  setupKeyboardListeners();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
