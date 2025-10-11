export const STORAGE_KEYS = {
  MENU_DATA: "menuData",
  ACTIVE_APP: "activeApp",
} as const;

export const ERROR_MESSAGES = {
  NO_MENU: "메뉴 항목이 없습니다.",
  NO_APP: "활성화된 앱 정보를 찾을 수 없습니다.",
  PERMISSION:
    "시스템 설정 > 개인정보 보호 및 보안 > 손쉬운 사용에서 앱 허용을 해 주세요",
  FETCH_ERROR: "활성화된 앱을 가져오는 중에 오류가 발생했습니다.",
} as const;
