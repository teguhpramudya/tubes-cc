# Landing Page Katalog Biji Kopi Menggunakan Docker, GitHub, dan AWS EC2

Project ini merupakan tugas besar mata kuliah **Komputasi Awan**. Website yang digunakan adalah landing page katalog biji kopi dengan tampilan awal yang tetap dipertahankan, tetapi sistemnya dikembangkan menjadi arsitektur **3-tier**, yaitu frontend, backend, dan database.

Project ini menggunakan **Docker Compose** untuk menjalankan seluruh service dalam container, kemudian di-deploy pada **AWS EC2** sebagai cloud server.

---

## Deskripsi Project

Website ini menampilkan katalog produk biji kopi Arabika dan form pemesanan. Pada versi awal, website hanya berupa landing page statis. Pada versi ini, sistem dikembangkan agar lebih sesuai dengan konsep komputasi awan dan arsitektur aplikasi modern.

- Data produk kopi diambil dari database melalui backend API.
- Form pemesanan dikirim ke backend dan disimpan ke database.
- Frontend, backend, dan database dijalankan dalam container Docker.
- Semua container dijalankan pada satu VM AWS EC2 menggunakan Docker Compose.

---

## Arsitektur Sistem

Project ini menggunakan implementasi **1 VM AWS EC2 dengan 3 container Docker**.

```text
User / Browser
      ↓
Frontend Container
HTML + CSS + JavaScript + Nginx
      ↓
Backend Container
Node.js + Express API
      ↓
Database Container
MySQL