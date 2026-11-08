export type Device = { os: "ios" | "android" | "desktop"; browser: "safari" | "chrome" | "firefox" | "edge" | "opera" | "samsung" | "other"; inApp: string | null; installed: boolean };
export type InstallStep =
  | "open-on-iphone" | "open-on-android" | "leave-app-ios" | "leave-app-android" | "switch-to-safari" | "switch-to-chrome"
  | "ios-share" | "ios-add" | "ios-confirm" | "android-one-tap" | "samsung-menu" | "samsung-add"
  | "android-menu" | "android-install" | "open-from-icon" | "notifications";
export declare function detectDevice(ua?: string, env?: { maxTouchPoints?: number; standalone?: boolean }): Device;
export declare function installSteps(phone: "ios" | "android", device: Pick<Device, "os" | "browser" | "inApp">, options?: { canPrompt?: boolean }): InstallStep[];
