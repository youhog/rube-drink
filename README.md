# 🧋 飲料紀錄表 (Drink Tracker)

一個簡單、美觀且具備雲端同步功能的飲料紀錄應用程式。紀錄每一口專屬於你的甜蜜時光！

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ 特色功能

*   **雲端同步**：使用 Firebase Firestore 儲存資料，手機、電腦紀錄隨時同步。
*   **即時更新**：新增紀錄後，列表會自動更新，無需重新整理網頁。
*   **無伺服器架構**：純靜態網頁 (Static Web) 搭配 Serverless 資料庫，部屬簡單且成本極低。
*   **安全性設計**：API Key 隱藏於環境變數中，並配合網域限制與安全規則保護資料。
*   **響應式設計**：完美支援手機與電腦版面 (Mobile First)。

## 🛠️ 技術棧

*   **前端**：HTML5, JavaScript (ES6+), Tailwind CSS (CDN)
*   **後端/資料庫**：Google Firebase (Firestore)
*   **部屬/CI**：GitHub Pages, GitHub Actions

## 🚀 快速開始

### 1. 本地開發 (Local Development)

由於專案使用了環境變數來保護 API Key，在本地執行時需要手動建立設定檔。

1.  複製專案到本地：
    ```bash
    git clone https://github.com/<您的帳號>/<專案名稱>.git
    cd <專案名稱>
    ```

2.  建立 `firebase-env.js` 檔案：
    在專案根目錄建立此檔案，並填入您的 Firebase 設定 (此檔案已被 `.gitignore` 排除，不會上傳)：
    ```javascript
    // firebase-env.js
    window.FIREBASE_CONFIG = {
        apiKey: "您的_API_KEY",
        authDomain: "您的專案ID.firebaseapp.com",
        projectId: "您的專案ID",
        storageBucket: "您的專案ID.firebasestorage.app",
        messagingSenderId: "您的傳送者ID",
        appId: "您的APP_ID",
        measurementId: "您的G-ID"
    };
    ```

3.  開啟網頁：
    直接用瀏覽器打開 `index.html` (建議使用 VS Code 的 Live Server 插件以避免 CORS 問題)。

### 2. 部屬到 GitHub Pages (Production)

本專案已設定好 GitHub Actions，只需設定 Secrets 即可自動部屬。

1.  **取得 Firebase Config JSON**：
    將您的設定整理成一行 JSON 字串：
    ```json
    {"apiKey":"...","authDomain":"...","projectId":"..."}
    ```

2.  **設定 GitHub Secrets**：
    *   進入 Repository 的 **Settings** > **Secrets and variables** > **Actions**。
    *   新增 Secret：
        *   Name: `FIREBASE_CONFIG`
        *   Value: (貼上剛剛那行 JSON)

3.  **推送程式碼**：
    ```bash
    git push origin main
    ```
    GitHub Actions 會自動建置並將 `FIREBASE_CONFIG` 注入到網頁中。

## 🔒 安全性設定 (重要)

為了保護您的資料庫，請務必在 Firebase Console 完成以下設定：

1.  **Firestore Security Rules (正式版規則)**：
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /drinks/{document=**} {
          allow read: if true; // 公開讀取
          allow create: if request.resource.data.store != null; // 僅允許新增
          allow update, delete: if false; // 禁止修改與刪除
        }
      }
    }
    ```

2.  **API Key 網域限制**：
    在 Google Cloud Console 中，限制 API Key 僅能由以下網域呼叫：
    *   `https://<您的帳號>.github.io/*`
    *   `http://localhost:*` (開發用)

## 📂 專案結構

```
.
├── index.html          # 網頁主架構
├── style.css           # 樣式表
├── script.js           # 邏輯控制與 Firebase 串接
├── favicon.svg         # 網站圖示
├── firebase-env.js     # (本地端) 環境變數設定檔，不版控
└── .github/
    └── workflows/
        └── deploy.yml  # 自動部屬流程
```

---
Made with ❤️ and 🧋