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

function getMacMenuBarInfo(activeApp) {
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
      console.error(`Error executing AppleScript: ${error || stderr}`);
      return;
    }

    const menuItems = parseMenuItems(stdout);
    console.log(JSON.stringify({ activeApp, menuItems }, null, 2));
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
      console.error(`에러 확인 탭: ${error || stderr}`);
      return;
    }

    const currentActiveApp = stdout.trim();

    if (currentActiveApp && currentActiveApp !== lastActiveApp) {
      lastActiveApp = currentActiveApp;
      getMacMenuBarInfo(currentActiveApp);
    }
  });
}

setInterval(checkActiveApp, 5000);
