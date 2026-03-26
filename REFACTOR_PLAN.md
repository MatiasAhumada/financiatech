# Refactor Plan: DeviceGuard → FinanceTech

## Overview
This document outlines the complete refactoring plan to rename the **DeviceGuard** project to **FinanceTech** across both web and desktop applications.

---

## 📋 Summary of Changes

| Application | Files to Modify | Key Changes |
|-------------|-----------------|-------------|
| **financiatech-web** | ~8 files | Package name, app title, branding, constants |
| **financiatech-desktop** | ~4 files | Package name, Electron config, APK paths, package names |

---

## 🌐 financiatech-web Changes

### 1. `package.json`
**Location:** `E:\DeviceGuard\financiatech-web\package.json`

| Field | Current | New |
|-------|---------|-----|
| `name` | `"deviceguard"` | `"financiatech"` |

### 2. `src/app/layout.tsx`
**Location:** `E:\DeviceGuard\financiatech-web\src\app\layout.tsx`

| Change | Current | New |
|--------|---------|-----|
| App title | `"DeviceGuard"` | `"FinanceTech"` |

### 3. `src/app/login/page.tsx`
**Location:** `E:\DeviceGuard\financiatech-web\src\app\login\page.tsx`

| Change | Current | New |
|--------|---------|-----|
| Login page branding | `"DeviceGuard"` | `"FinanceTech"` |

### 4. `src/components/layout/Sidebar.tsx`
**Location:** `E:\DeviceGuard\financiatech-web\src\components\layout\Sidebar.tsx`

| Change | Current | New |
|--------|---------|-----|
| Sidebar branding (2 occurrences) | `"DeviceGuard"` | `"FinanceTech"` |

### 5. `src/components/sales/ActivationSuccessView.tsx`
**Location:** `E:\DeviceGuard\financiatech-web\src\components\sales\ActivationSuccessView.tsx`

| Change | Current | New |
|--------|---------|-----|
| Success message | `"El dispositivo ya está bajo monitoreo de DeviceGuard"` | `"El dispositivo ya está bajo monitoreo de FinanceTech"` |

### 6. `src/constants/sales.constant.ts`
**Location:** `E:\DeviceGuard\financiatech-web\src\constants\sales.constant.ts`

| Change | Current | New |
|--------|---------|-----|
| MDM app name (3 occurrences) | `"DeviceGuard MDM"` / `"app DeviceGuard"` | `"FinanceTech MDM"` / `"app FinanceTech"` |

---

## 🖥️ financiatech-desktop Changes

### 1. `package.json`
**Location:** `E:\DeviceGuard\financiatech-desktop\package.json`

| Field | Current | New |
|-------|---------|-----|
| `name` | `"deviceguard-desktop"` | `"financiatech-desktop"` |
| `description` | `"DeviceGuard Provisioner Desktop Application"` | `"FinanceTech Provisioner Desktop Application"` |
| `author` | `"DeviceGuard Team"` | `"FinanceTech Team"` |
| `build.appId` | `"com.deviceguard.provisioner"` | `"com.financiatech.provisioner"` |
| `build.productName` | `"DeviceGuard Provisioner"` | `"FinanceTech Provisioner"` |

### 2. `electron.cjs`
**Location:** `E:\DeviceGuard\financiatech-desktop\electron.cjs`

| Change | Current | New |
|--------|---------|-----|
| Window title | `'DeviceGuard Provisioner'` | `'FinanceTech Provisioner'` |

### 3. `src/App.tsx`
**Location:** `E:\DeviceGuard\financiatech-desktop\src\App.tsx`

| Change | Current | New |
|--------|---------|-----|
| APK path | `E:\DeviceGuard\deviceguard-app\...` | `E:\DeviceGuard\financiatech-app\...` |
| Android package name | `com.deviceguard.kiosk` | `com.financiatech.kiosk` |
| Logcat tag 1 | `DeviceGuard` | `FinanceTech` |
| Logcat tag 2 | `DeviceGuardJS` | `FinanceTechJS` |
| UI title | `"DeviceGuard Provisioner"` | `"FinanceTech Provisioner"` |

---

## 🔗 Related Repository Reference

### `financiatech-app` (Android Kiosk App)
**Location:** `E:\DeviceGuard\deviceguard-app\`

> ⚠️ **Note:** The desktop app references this path for the APK file. The folder is already named `financiatech-app` but there may be internal references to `deviceguard` that need updating.

**Files to check:**
- `package.json` - app name and package identifier
- `app.json` - Expo configuration
- Android manifest and build configurations
- Any references to `com.deviceguard.kiosk`

---

## ✅ Execution Checklist

### Phase 1: Web Application ✅ COMPLETED
- [x] Update `financiatech-web/package.json`
- [x] Update `financiatech-web/src/app/layout.tsx`
- [x] Update `financiatech-web/src/app/login/page.tsx`
- [x] Update `financiatech-web/src/components/layout/Sidebar.tsx`
- [x] Update `financiatech-web/src/components/sales/ActivationSuccessView.tsx`
- [x] Update `financiatech-web/src/constants/sales.constant.ts`

### Phase 2: Desktop Application ✅ COMPLETED
- [x] Update `financiatech-desktop/package.json`
- [x] Update `financiatech-desktop/electron.cjs`
- [x] Update `financiatech-desktop/src/App.tsx`

### Phase 3: Mobile App (if applicable) ⏳ PENDING
- [ ] Check and update `deviceguard-app` (financiatech-app) internal references
- [ ] Update Android package name in build configs
- [ ] Update app.json / package.json

### Phase 4: Verification ⏳ PENDING
- [ ] Run web app: `pnpm dev` in financiatech-web
- [ ] Run desktop app: `pnpm dev` in financiatech-desktop
- [ ] Verify no console errors related to renamed items
- [ ] Search codebase for remaining "DeviceGuard" references

---

## 🔍 Post-Refactor Verification Commands

```bash
# Search for any remaining DeviceGuard references (case-insensitive)
grep -ri "deviceguard" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.js" --include="*.cjs" financiatech-web/

grep -ri "deviceguard" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.js" --include="*.cjs" financiatech-desktop/
```

---

## ⚠️ Important Notes

1. **Database/Backend:** The web app uses PostgreSQL with Prisma. No database schema changes are required as the rename is UI/branding only.

2. **Environment Variables:** Check `.env` files for any DeviceGuard references (unlikely but verify).

3. **GitHub Workflows:** Check `.github/workflows/` for any CI/CD references.

4. **External Dependencies:** The Android kiosk app (`com.deviceguard.kiosk`) needs to be updated to `com.financiatech.kiosk` - this may require rebuilding the APK.

5. **Path References:** The desktop app has a hardcoded path to the APK. Ensure the path matches the actual folder structure after any renaming.

---

## 📝 Git Commit Strategy

After completing the refactor, consider separate commits for each application:

```bash
# Commit 1: Web app
git add financiatech-web/
git commit -m "refactor: rename DeviceGuard to FinanceTech in web app"

# Commit 2: Desktop app
git add financiatech-desktop/
git commit -m "refactor: rename DeviceGuard to FinanceTech in desktop app"

# Commit 3: Mobile app (if applicable)
git add deviceguard-app/
git commit -m "refactor: rename DeviceGuard to FinanceTech in mobile kiosk app"
```

---

## 🚀 Ready to Execute

This plan covers all identified references. Would you like me to proceed with executing these changes?
