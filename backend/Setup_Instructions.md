# Backend Setup Instructions

Since this application uses Google Sheets as a database, you need to host the backend logic on Google Apps Script.

## 1. Create the Script
1. Go to [Google Apps Script](https://script.google.com/home).
2. Click **New Project**.
3. Rename the project to "Apjatel PMO Backend".
4. Copy the content of `backend/Code.gs` from this project and paste it into the script editor (replacing the default `myFunction`).

## 2. Initialize Database
1. Inside the script editor, select `setup` from the function dropdown menu (top toolbar).
2. Click **Run**.
3. You will be asked to **Review Permissions**. Click it, select your account, click Advanced -> Go to Script (Unsafe) -> Allow.
   *This creates the "Projects" and "Users" sheets in your connected Google Sheet.*

## 3. Deploy
1. Click the blue **Deploy** button (top right) -> **New deployment**.
2. Click the Gear icon (Select type) -> **Web app**.
3. Fill in:
   - **Description**: v1
   - **Execute as**: Me (your_email@gmail.com) -> *Crucial for database access*
   - **Who has access**: **Anyone** -> *Crucial for the React app to fetch data without complex OAuth*
4. Click **Deploy**.
5. Copy the **Web App URL** (starts with `https://script.google.com/macros/s/...`).

## 4. Connect Frontend
1. Open `services/mockSheetService.ts` in your local project.
2. Replace the `API_URL` variable with your new Web App URL.
   ```typescript
   const API_URL = 'https://script.google.com/macros/s/YOUR_NEW_ID/exec';
   ```

## 5. Default Login
Once setup, you can login with:
- **Admin**: ID: `admin`, Pass: `admin123`
- **Vendor**: ID: `vendor1`, Pass: `vendor123`
