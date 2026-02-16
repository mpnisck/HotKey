const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function afterPack(context) {
  if (process.platform !== "darwin") return;

  const appOutDir = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  const macKeyServerPath = path.join(
    appPath,
    "Contents",
    "Resources",
    "app.asar.unpacked",
    "node_modules",
    "node-global-key-listener",
    "bin",
    "MacKeyServer"
  );

  if (fs.existsSync(macKeyServerPath)) {
    try {
      fs.chmodSync(macKeyServerPath, 0o755);
      console.log("[afterPack] MacKeyServer 실행 권한 설정 완료");
    } catch (e) {
      console.warn("[afterPack] MacKeyServer 권한 설정 실패:", e.message);
    }

    try {
      execSync(`xattr -cr "${path.dirname(macKeyServerPath)}"`, {
        timeout: 5000,
      });
      console.log("[afterPack] quarantine 속성 제거 완료");
    } catch (e) {
      console.warn("[afterPack] quarantine 속성 제거 실패:", e.message);
    }

    try {
      execSync(`codesign --force --deep -s - "${macKeyServerPath}"`, {
        timeout: 10000,
      });
      console.log("[afterPack] MacKeyServer ad-hoc 서명 완료");
    } catch (e) {
      console.warn("[afterPack] MacKeyServer ad-hoc 서명 실패:", e.message);
    }
  } else {
    console.warn(
      "[afterPack] MacKeyServer 바이너리를 찾을 수 없음:",
      macKeyServerPath
    );
    const binDir = path.dirname(macKeyServerPath);
    if (fs.existsSync(binDir)) {
      console.log("[afterPack] bin 디렉토리 내용:", fs.readdirSync(binDir));
    }
  }

  try {
    execSync(`codesign --force --deep -s - "${appPath}"`, { timeout: 30000 });
    console.log("[afterPack] 앱 번들 ad-hoc 서명 완료:", appPath);
  } catch (e) {
    console.warn("[afterPack] 앱 번들 ad-hoc 서명 실패:", e.message);
  }
};
