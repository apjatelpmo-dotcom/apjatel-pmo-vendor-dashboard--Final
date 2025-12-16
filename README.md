
# Apjatel PMO Vendor Dashboard

Dashboard Project Management Office (PMO) modern untuk monitoring vendor pelaksana APJATEL.

## 🛠 Tech Stack
*   **React + TypeScript + Vite**: Frontend Framework yang cepat.
*   **Tailwind CSS**: Styling modern.
*   **Google Sheets API**: Database sederhana tanpa backend server.
*   **Gemini AI**: Analisa data otomatis.

## 🚀 Cara Edit & Update (Developer Mode)

1.  Pastikan sudah install **Node.js** dan **GitHub Desktop**.
2.  Buka folder ini di **VS Code**.
3.  Install dependencies (hanya pertama kali):
    ```bash
    npm install
    ```
4.  Jalankan di laptop (Local):
    ```bash
    npm run dev
    ```
5.  Aplikasi jalan di `http://localhost:5173`.

## 🌐 Cara Online (Automated Deployment)

Project ini terhubung dengan **Netlify**.
Setiap kali Anda melakukan **Commit & Push** ke GitHub, Netlify akan otomatis mengupdate website.

### Pengaturan Netlify (Build Settings)
Jika Anda setup manual di Netlify, gunakan setting ini:
*   **Build Command:** `npm run build`
*   **Publish Directory:** `dist`

### Environment Variables (Di Netlify)
Jangan lupa masukkan API Key di menu **Site Settings > Environment Variables**:
*   `API_KEY`: (Isi dengan Google Gemini API Key Anda)
