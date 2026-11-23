# guoyu3　快樂學國語（三年級上學期，康軒版第 5 冊）

- `test.html`、`t/`：測試頁（老師確認後才更新正式網站 `index.html`）
- `src/`：網站程式，沿用四年級 guoyu4 的底座（`core.js`），`views3.js` 是三年級各分頁；三年級另加集花與小花園
- `lessons_src/課次/`：各課資料（`lesson.py`）、多音字讀音規則（`zyrules.py`）、插圖（`art.py`）
- `tools/build.py`：組出網站、依課次做字型子集、加密課文

建置（需要芫荽體、注音芫荽體字型檔與課文原稿，課文原稿和密碼不放在儲存庫）：

    GUOYU_PW=課文密碼 python3 tools/build.py test

作答紀錄後端與老師帳號和四、六年級共用（同一個 Apps Script）；組別名稱以「三年級｜」開頭。
