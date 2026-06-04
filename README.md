# Siputra Coffee Beans — Landing Page Katalog Biji Kopi

Project ini adalah Tugas Besar mata kuliah **Komputasi Awan (Cloud Computing)** dengan topik:

> **Landing Page Katalog Biji Kopi Menggunakan Docker, GitHub, dan Cloud AWS**

Website ini menampilkan katalog biji kopi, form pemesanan, metode pembayaran, upload bukti transfer, serta halaman admin untuk mengelola produk, pembayaran, dan pesanan.

---

## 1. Identitas Project

| Keterangan | Isi |
|---|---|
| Nama Website | Siputra Coffee Beans |
| Jenis Project | Landing Page + Admin Dashboard |
| Arsitektur | 3-Tier Architecture |
| Frontend | HTML, CSS, JavaScript, Nginx |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Container | Docker dan Docker Compose |
| Cloud | AWS EC2 |
| Repository | https://github.com/teguhpramudya/tubes-cc |

---

## 2. Fitur Utama

### Fitur User

- Melihat landing page Siputra Coffee Beans.
- Melihat katalog produk biji kopi.
- Klik harga produk untuk langsung menuju form pemesanan.
- Produk otomatis terpilih saat user klik harga pada katalog.
- Mengisi form pemesanan.
- Memilih metode pembayaran.
- Melihat detail rekening pembayaran.
- Upload bukti transfer dalam format JPG/PNG.
- Validasi input agar user tidak mengisi data secara asal.
- Tampilan responsive untuk desktop, tablet, dan mobile.
- Logo website muncul pada tab browser/taskbar browser melalui favicon.

### Fitur Admin

- Login admin sederhana menggunakan username dan password.
- Dashboard admin dengan tampilan simple dan warna coklat-krem-putih.
- Sidebar admin menggunakan logo `logo.jpg`.
- Logo admin memiliki animasi hover.
- Admin dapat mengelola produk:
  - tambah produk,
  - edit produk,
  - hapus produk,
  - upload foto produk.
- Admin dapat mengelola metode pembayaran:
  - tambah metode pembayaran,
  - edit metode pembayaran,
  - aktif/nonaktif metode pembayaran,
  - hapus metode pembayaran.
- Admin dapat melihat data pesanan.
- Admin dapat melihat bukti transfer yang diupload user.
- Admin dapat mengubah status pembayaran pesanan.
- Admin dapat menghapus pesanan.

---

## 3. Login Admin

Halaman login admin:

```text
http://localhost/login.html
```

Akun login:

```text
Username: admin
Password: admin123
```

Setelah login berhasil, admin akan langsung diarahkan ke halaman:

```text
http://localhost/admin.html
```

---

## 4. Metode Pembayaran

Metode pembayaran default:

```text
Transfer Bank : BCA
No. Rekening  : 1234567890
Atas Nama     : Siputra Coffee Beans
```

Metode pembayaran dapat ditambah, diedit, dinonaktifkan, atau dihapus melalui halaman admin.

---

## 5. Arsitektur Sistem

Project ini menggunakan arsitektur **3-tier**, yaitu:

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
```

Penjelasan layer:

| Layer | Fungsi | Implementasi |
|---|---|---|
| Presentation Layer | Menampilkan halaman website | Frontend HTML, CSS, JS, Nginx |
| Application Layer | Mengolah request dan API | Backend Node.js + Express |
| Data Layer | Menyimpan data aplikasi | MySQL |

---

## 6. Struktur Folder

```text
tubes-cc/
├── backend/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── database/
│   └── init.sql
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── img/
│   │   │   ├── favicon.ico
│   │   │   ├── hero-bg.jpg
│   │   │   ├── kopi-gayo.jpg
│   │   │   ├── kopi-kerinci.jpg
│   │   │   ├── kopi-robusta.jpg
│   │   │   └── logo.jpg
│   │   └── js/
│   │       ├── admin.js
│   │       ├── login.js
│   │       └── script.js
│   ├── admin.html
│   ├── Dockerfile
│   ├── favicon.ico
│   ├── index.html
│   ├── login.html
│   └── nginx.conf
│
├── .dockerignore
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 7. Service Docker

Project ini dijalankan menggunakan 3 container utama:

| Container | Fungsi | Port |
|---|---|---|
| `katalog-kopi-frontend` | Menjalankan frontend menggunakan Nginx | 80 |
| `katalog-kopi-backend` | Menjalankan backend Express.js | 3000 internal |
| `katalog-kopi-db` | Menjalankan database MySQL | 3306 internal |

Backend dan database tidak perlu dibuka langsung ke internet karena diakses secara internal oleh Docker network.

---

## 8. Endpoint API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Mengecek status backend dan database |
| GET | `/api/products` | Mengambil semua produk |
| POST | `/api/products` | Menambah produk |
| PUT | `/api/products/:id` | Mengubah produk |
| DELETE | `/api/products/:id` | Menghapus produk |
| GET | `/api/payment-methods` | Mengambil metode pembayaran aktif |
| GET | `/api/payment-methods/all` | Mengambil semua metode pembayaran untuk admin |
| POST | `/api/payment-methods` | Menambah metode pembayaran |
| PUT | `/api/payment-methods/:id` | Mengubah metode pembayaran |
| DELETE | `/api/payment-methods/:id` | Menghapus metode pembayaran |
| GET | `/api/orders` | Mengambil data pesanan |
| POST | `/api/orders` | Menyimpan pesanan dan bukti transfer |
| PUT/PATCH | `/api/orders/:id/status` | Mengubah status pembayaran |
| DELETE | `/api/orders/:id` | Menghapus satu pesanan |
| DELETE | `/api/orders` | Menghapus semua pesanan |
| POST | `/api/upload` | Upload gambar produk |

---

## 9. Cara Menjalankan Project di Laptop Lokal

Pastikan **Docker Desktop** sudah berjalan.

Masuk ke folder project:

```bash
cd "C:\Users\ASUS\Documents\GitHub\tubes-cc"
```

Jalankan project:

```bash
docker compose up -d --build
```

Cek container:

```bash
docker ps
```

Website user:

```text
http://localhost
```

Login admin:

```text
http://localhost/login.html
```

Admin page:

```text
http://localhost/admin.html
```

Cek API:

```text
http://localhost/api/health
http://localhost/api/products
```

---

## 10. Cara Mematikan Project Lokal

```bash
docker compose down
```

Jangan gunakan command berikut jika tidak ingin menghapus data database lokal:

```bash
docker compose down -v
```

---

## 11. Cara Push Update ke GitHub

Cek perubahan:

```bash
git status
```

Tambahkan semua perubahan:

```bash
git add -A
```

Commit:

```bash
git commit -m "Update final project"
```

Push:

```bash
git push -u origin main
```

---

## 12. Deployment ke AWS EC2

### 12.1 Membuat Instance EC2

Konfigurasi EC2 yang digunakan:

| Bagian | Konfigurasi |
|---|---|
| AMI | Ubuntu Server 24.04 LTS |
| Instance type | t2.micro |
| Key pair | labsuser.pem / vockey |
| Storage | 8 GiB |
| Security Group | SSH dan HTTP |

Inbound rules yang dibutuhkan:

| Type | Port | Source |
|---|---:|---|
| SSH | 22 | My IP / Anywhere |
| HTTP | 80 | 0.0.0.0/0 |

### 12.2 SSH ke EC2

Contoh:

```bash
ssh -i "C:\Users\ASUS\Downloads\labsuser (1).pem" ubuntu@PUBLIC-IP-EC2
```

### 12.3 Install Docker, Docker Compose, dan Git

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 git -y
sudo systemctl start docker
sudo systemctl enable docker
```

Cek versi:

```bash
docker --version
docker compose version
git --version
```

### 12.4 Clone Repository

```bash
git clone https://github.com/teguhpramudya/tubes-cc.git
cd tubes-cc
```

### 12.5 Jalankan Project di EC2

```bash
sudo docker compose up -d --build
```

Cek container:

```bash
sudo docker ps
```

Jika berhasil, akan muncul container:

```text
katalog-kopi-frontend
katalog-kopi-backend
katalog-kopi-db
```

### 12.6 Akses Website dari Browser

Website user:

```text
http://PUBLIC-IP-EC2
```

Login admin:

```text
http://PUBLIC-IP-EC2/login.html
```

Admin page:

```text
http://PUBLIC-IP-EC2/admin.html
```

Catatan: gunakan `http://`, bukan `https://`, karena project belum menggunakan SSL.

---

## 13. Update Project di AWS Setelah Push GitHub

Masuk ke EC2 melalui SSH, lalu jalankan:

```bash
cd ~/tubes-cc
git pull origin main
sudo docker compose down
sudo docker compose up -d --build
sudo docker ps
```
>Catatan: Public IPv4 EC2 dapat berubah ketika instance atau AWS Academy Lab dimulai ulang. Jika IP berubah, gunakan IP terbaru dari halaman EC2 Instances.

---

## 14. Testing Fitur

### Testing User

1. Buka `http://localhost`.
2. Pastikan katalog produk muncul.
3. Klik harga produk.
4. Pastikan halaman langsung menuju form pemesanan.
5. Isi form pemesanan.
6. Pilih metode pembayaran.
7. Upload bukti transfer JPG/PNG.
8. Klik **Pesan Sekarang**.
9. Pastikan pesanan berhasil dikirim.

### Testing Admin

1. Buka `http://localhost/login.html`.
2. Login menggunakan:
   ```text
   admin / admin123
   ```
3. Buka dashboard admin.
4. Cek data produk.
5. Tambah, edit, dan hapus produk.
6. Tambah, edit, dan hapus metode pembayaran.
7. Cek pesanan yang masuk.
8. Buka bukti transfer.
9. Ubah status pembayaran.

---

## 15. Status Pembayaran

Status pembayaran yang dapat digunakan:

```text
Menunggu Verifikasi
Sudah Dibayar
Ditolak
Dibatalkan
```

---

## 16. Troubleshooting

### Website AWS tidak bisa dibuka

Pastikan membuka dengan HTTP:

```text
http://PUBLIC-IP-EC2
```

Bukan:

```text
https://PUBLIC-IP-EC2
```

Pastikan security group membuka port 80:

```text
HTTP | TCP | 80 | 0.0.0.0/0
```

### SSH timeout

Kemungkinan penyebab:

1. Public IP berubah.
2. EC2 belum running.
3. Security group belum membuka port 22.
4. AWS Academy lab belum aktif.
5. Instance masih initializing.

### Docker Compose tidak ditemukan

Gunakan:

```bash
sudo apt install docker-compose-v2 -y
```

Jika tidak tersedia, gunakan alternatif:

```bash
sudo apt install docker-compose -y
```

### Perubahan tampilan belum muncul

Coba rebuild:

```bash
docker compose down
docker compose up -d --build
```

Lalu tekan:

```text
Ctrl + F5
```

atau buka melalui incognito.

### Favicon belum berubah

Browser sering menyimpan cache favicon. Solusi:

1. Tekan `Ctrl + F5`.
2. Buka incognito.
3. Hapus cache browser.
4. Pastikan file berikut ada:
   ```text
   frontend/assets/img/favicon.ico
   frontend/favicon.ico
   ```

---

## 17. Konsep Cloud Computing yang Diterapkan

| Konsep | Implementasi |
|---|---|
| Cloud Computing | Website di-deploy pada AWS EC2 |
| Public Cloud | Menggunakan layanan AWS Academy |
| IaaS | Menggunakan EC2 sebagai virtual server |
| Virtual Machine | Ubuntu Server berjalan sebagai VM di AWS |
| Containerization | Frontend, backend, dan database berjalan dalam Docker container |
| Docker Compose | Menjalankan beberapa container dengan satu konfigurasi |
| 3-Tier Architecture | Frontend, backend, dan database dipisahkan |
| GitHub | Source code disimpan dan di-update melalui repository |
| Network Security | Security group mengatur akses SSH dan HTTP |

---

## 18. Bukti Dokumentasi untuk Laporan/Video

Dokumentasi yang perlu disiapkan:

1. Repository GitHub.
2. Struktur folder project.
3. Docker Compose berjalan di laptop.
4. Hasil `docker ps` lokal.
5. AWS EC2 running.
6. SSH dari terminal laptop ke EC2.
7. Instalasi Docker di EC2.
8. Hasil `sudo docker ps` di EC2.
9. Hasil `curl http://localhost/api/health`.
10. Hasil `curl http://localhost/api/products`.
11. Website user di public IP AWS.
12. Login admin di public IP AWS.
13. Admin dashboard.
14. Fitur tambah/edit/hapus produk.
15. Fitur tambah/edit/hapus metode pembayaran.
16. Form pemesanan user.
17. Upload bukti transfer.
18. Bukti transfer muncul di admin.
19. Ubah status pembayaran.

---

## 19. Command Penting

Menjalankan project:

```bash
docker compose up -d --build
```

Mematikan project:

```bash
docker compose down
```

Melihat container:

```bash
docker ps
```

Melihat log container:

```bash
docker logs nama-container
```

Update project di EC2:

```bash
cd ~/tubes-cc
git pull origin main
sudo docker compose down
sudo docker compose up -d --build
sudo docker ps
```

---

## 20. Kesimpulan

Project **Siputra Coffee Beans** berhasil dibuat sebagai aplikasi web berbasis 3-tier architecture. Aplikasi memiliki frontend, backend, dan database yang berjalan menggunakan Docker container. Project juga berhasil dihubungkan dengan GitHub dan dapat di-deploy ke AWS EC2.

Website ini tidak hanya menampilkan katalog produk, tetapi juga memiliki fitur pemesanan, metode pembayaran, upload bukti transfer, login admin, dashboard admin, serta pengelolaan data produk, pembayaran, dan pesanan.
