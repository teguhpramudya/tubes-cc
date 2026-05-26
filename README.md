# Siputra Coffee Bean — Landing Page Katalog Biji Kopi

Project ini merupakan tugas besar mata kuliah **Komputasi Awan** dengan topik **Landing Page Katalog Biji Kopi Menggunakan Docker, GitHub, dan Cloud AWS**.

Website ini awalnya berupa landing page katalog biji kopi, lalu dikembangkan menjadi aplikasi web sederhana berbasis **3-Tier Architecture** yang terdiri dari **frontend**, **backend**, dan **database**. Project ini dijalankan menggunakan **Docker Compose**, disimpan di **GitHub**, dan di-deploy ke **AWS EC2**.

---

## Deskripsi Project

**Siputra Coffee Bean** adalah website katalog biji kopi yang menampilkan produk kopi, form pemesanan, metode pembayaran, upload bukti transfer, serta halaman admin untuk mengelola data.

Fitur utama project:

- Menampilkan katalog produk biji kopi.
- Data produk diambil dari database melalui backend API.
- User dapat klik harga produk untuk langsung menuju form pemesanan.
- User dapat mengisi form pemesanan.
- Form memiliki validasi agar user tidak mengisi data secara asal.
- User dapat memilih metode pembayaran.
- User dapat upload bukti transfer JPG/PNG.
- Admin dapat login menggunakan username dan password sederhana.
- Admin dapat mengelola produk.
- Admin dapat mengelola metode pembayaran.
- Admin dapat melihat pesanan dan bukti transfer.
- Admin dapat mengubah status pembayaran.
- Website responsive untuk desktop, tablet, dan mobile.
- Frontend, backend, dan database berjalan dalam container Docker.
- Deployment dilakukan pada AWS EC2.

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
```

Admin page tetap berada di dalam **frontend container**, sehingga deployment tetap menggunakan **1 VM AWS EC2**.

```text
1 VM AWS EC2
├── frontend container
│   ├── index.html
│   ├── login.html
│   └── admin.html
├── backend container
└── database container
```

---

## Pembagian Layer

| Layer | Fungsi | Teknologi |
|---|---|---|
| Frontend | Menampilkan landing page, form pemesanan, login admin, dan dashboard admin | HTML, CSS, JavaScript, Nginx |
| Backend | Menyediakan API produk, pesanan, metode pembayaran, upload gambar, dan upload bukti transfer | Node.js, Express, Multer |
| Database | Menyimpan produk, metode pembayaran, pesanan, status pembayaran, dan path bukti transfer | MySQL |
| Cloud Server | Menjalankan semua container | AWS EC2 Ubuntu |
| Containerization | Menjalankan service secara terisolasi | Docker, Docker Compose |
| Repository | Menyimpan source code project | GitHub |

---

## Struktur Folder

```text
tubes-cc/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── img/
│   │   └── js/
│   │       ├── script.js
│   │       ├── login.js
│   │       └── admin.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
│
├── database/
│   └── init.sql
│
├── docker-compose.yml
├── README.md
├── .gitignore
└── .dockerignore
```

---

## Fitur User

| Fitur | Keterangan |
|---|---|
| Landing page | Menampilkan profil singkat website dan katalog kopi |
| Katalog produk | Produk diambil dari database |
| Klik harga produk | Mengarahkan user ke form pemesanan dan memilih produk otomatis |
| Form pemesanan | User mengisi nama, WhatsApp, produk, jumlah, alamat, metode pembayaran, dan bukti transfer |
| Validasi form | Mencegah input asal seperti nama tidak valid, nomor WhatsApp salah, alamat terlalu pendek, dan file tidak sesuai |
| Metode pembayaran | User memilih metode pembayaran yang aktif |
| Upload bukti transfer | User upload file JPG/PNG maksimal 10 MB |

---

## Fitur Admin

Admin dapat mengakses halaman login:

```text
http://localhost/login.html
```

Login admin:

```text
Username: admin
Password: admin123
```

Fitur admin:

| Fitur | Keterangan |
|---|---|
| Login admin | Admin harus login sebelum masuk dashboard |
| Dashboard admin | Tampilan admin sederhana dengan sidebar |
| Kelola produk | Tambah, edit, hapus, refresh produk |
| Upload foto produk | Admin dapat upload foto produk JPG/PNG |
| Kelola metode pembayaran | Tambah, edit, aktif/nonaktif, hapus metode pembayaran |
| Data pesanan | Melihat pesanan dari user |
| Bukti transfer | Bukti transfer user dapat dibuka dari admin |
| Status pembayaran | Admin dapat mengubah status pembayaran |
| Logout | Admin dapat keluar dari halaman admin |

Catatan: login admin pada project ini dibuat sederhana untuk kebutuhan prototype/tugas kuliah.

---

## Metode Pembayaran

Metode pembayaran default yang tersedia:

```text
Transfer Bank: BCA
No. Rekening: 1234567890
Atas Nama: Siputra Coffee Beans
```

Admin dapat menambah metode pembayaran lain melalui dashboard admin. Metode pembayaran yang aktif akan muncul di form pemesanan user.

---

## Endpoint Backend

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Mengecek status backend dan database |
| GET | `/api/products` | Mengambil data produk |
| POST | `/api/products` | Menambah produk |
| PUT | `/api/products/:id` | Mengubah produk |
| DELETE | `/api/products/:id` | Menghapus produk |
| POST | `/api/upload` | Upload gambar produk |
| GET | `/api/payment-methods` | Mengambil metode pembayaran aktif |
| POST | `/api/payment-methods` | Menambah metode pembayaran |
| PUT | `/api/payment-methods/:id` | Mengubah metode pembayaran |
| DELETE | `/api/payment-methods/:id` | Menghapus metode pembayaran |
| POST | `/api/orders` | Menyimpan pesanan dan bukti transfer |
| GET | `/api/orders` | Mengambil data pesanan |
| PUT | `/api/orders/:id/payment-status` | Mengubah status pembayaran |
| DELETE | `/api/orders/:id` | Menghapus satu pesanan |
| DELETE | `/api/orders` | Menghapus semua pesanan |

---

## Menjalankan Project di Lokal

Pastikan **Docker Desktop** sudah berjalan.

Masuk ke folder project:

```bash
cd "C:\Users\ASUS\Documents\GitHub\tubes-cc"
```

Jalankan seluruh service:

```bash
docker compose up -d --build
```

Cek container:

```bash
docker ps
```

Container yang harus berjalan:

```text
katalog-kopi-frontend
katalog-kopi-backend
katalog-kopi-db
```

Akses website:

```text
http://localhost
```

Akses login admin:

```text
http://localhost/login.html
```

Akses admin page:

```text
http://localhost/admin.html
```

Cek API:

```text
http://localhost/api/health
http://localhost/api/products
```

---

## Testing Lokal

### 1. Testing Website User

1. Buka `http://localhost`.
2. Pastikan katalog produk muncul.
3. Klik harga produk.
4. Pastikan halaman langsung menuju form pemesanan.
5. Pastikan produk otomatis terpilih.

### 2. Testing Form Pemesanan

Contoh data valid:

```text
Nama: Teguh Pramudya
WhatsApp: 081234567890
Produk: Arabika Gayo
Jumlah: 1
Alamat: Telkom University
Metode Pembayaran: Transfer BCA
Bukti Transfer: file JPG/PNG
```

Klik:

```text
Pesan Sekarang
```

Jika berhasil, pesanan akan masuk ke database dan tampil pada admin page.

### 3. Testing Admin

1. Buka `http://localhost/login.html`.
2. Login dengan username `admin` dan password `admin123`.
3. Buka dashboard admin.
4. Coba tambah/edit/hapus produk.
5. Coba tambah/edit/hapus metode pembayaran.
6. Coba lihat data pesanan.
7. Coba buka bukti transfer.
8. Coba ubah status pembayaran.

---

## Deploy ke AWS EC2

### 1. Buat EC2 Instance

Gunakan konfigurasi berikut:

| Bagian | Isi |
|---|---|
| Name | `tubes-cc-katalog-kopi` |
| AMI | Ubuntu Server 24.04 LTS |
| Instance Type | `t2.micro` |
| Key Pair | `vockey` / `labsuser.pem` |
| Storage | 8 GiB atau lebih |
| Security Group | SSH dan HTTP |

Inbound rule yang digunakan:

| Type | Port | Source | Fungsi |
|---|---:|---|---|
| SSH | 22 | My IP / Anywhere | Login ke server EC2 |
| HTTP | 80 | Anywhere | Akses website dari browser |

Tidak perlu membuka port `3000` dan `3306`, karena backend dan database hanya digunakan internal oleh Docker.

---

### 2. SSH ke EC2 dari Terminal Laptop

Masuk ke folder tempat file `.pem` berada:

```bash
cd "C:\Users\ASUS\Downloads"
```

Atur permission file `.pem`:

```powershell
icacls "labsuser (1).pem" /inheritance:r
icacls "labsuser (1).pem" /grant "$($env:USERNAME):(R)"
```

SSH ke EC2:

```bash
ssh -i "labsuser (1).pem" ubuntu@PUBLIC-IP-EC2
```

Contoh:

```bash
ssh -i "labsuser (1).pem" ubuntu@54.87.20.30
```

Jika berhasil, terminal akan berubah menjadi:

```bash
ubuntu@ip-172-31-17-213:~$
```

---

### 3. Install Docker dan Git di EC2

Jalankan di terminal EC2:

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

---

### 4. Clone Repository

```bash
git clone https://github.com/teguhpramudya/tubes-cc.git
cd tubes-cc
```

Cek isi folder:

```bash
ls
```

---

### 5. Jalankan Project di EC2

```bash
sudo docker compose up -d --build
```

Cek container:

```bash
sudo docker ps
```

Pastikan muncul:

```text
katalog-kopi-frontend
katalog-kopi-backend
katalog-kopi-db
```

---

### 6. Cek API di EC2

```bash
curl http://localhost/api/health
curl http://localhost/api/products
```

Hasil health yang diharapkan:

```json
{"status":"ok","service":"backend","database":"connected"}
```

---

### 7. Buka Website dari Browser

Ganti `PUBLIC-IP-EC2` dengan public IP instance.

Halaman user:

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

Contoh:

```text
http://54.87.20.30
http://54.87.20.30/login.html
http://54.87.20.30/admin.html
```

---

## Update Project di AWS Setelah Push GitHub

Jika ada perubahan kode di laptop:

```bash
git add -A
git commit -m "Update project"
git push -u origin main
```

Lalu update di EC2:

```bash
cd ~/tubes-cc
git pull origin main
sudo docker compose down
sudo docker compose up -d --build
sudo docker ps
```

---

## Command Penting

### Menjalankan container lokal

```bash
docker compose up -d --build
```

### Mematikan container lokal

```bash
docker compose down
```

### Menjalankan container di EC2

```bash
sudo docker compose up -d --build
```

### Mematikan container di EC2

```bash
sudo docker compose down
```

### Reset database

```bash
docker compose down -v
docker compose up -d --build
```

Untuk EC2:

```bash
sudo docker compose down -v
sudo docker compose up -d --build
```

Catatan: command `down -v` akan menghapus data database, termasuk produk tambahan, pesanan, dan metode pembayaran yang ditambahkan melalui admin.

### Melihat log backend

```bash
docker logs katalog-kopi-backend
```

Untuk EC2:

```bash
sudo docker logs katalog-kopi-backend
```

---

## Bukti Dokumentasi

Screenshot yang dapat digunakan untuk laporan atau video presentasi:

1. Repository GitHub.
2. Struktur folder project.
3. Docker Compose berjalan di laptop.
4. Hasil `docker ps` di laptop.
5. EC2 instance running.
6. SSH ke EC2 dari terminal laptop.
7. Instalasi Docker di EC2.
8. Hasil `sudo docker ps` di EC2.
9. Hasil `curl http://localhost/api/health`.
10. Hasil `curl http://localhost/api/products`.
11. Website user dari public IP AWS.
12. Login admin dari public IP AWS.
13. Admin page dari public IP AWS.
14. Fitur tambah/edit/hapus produk.
15. Fitur tambah/edit/hapus metode pembayaran.
16. Form pemesanan user.
17. Upload bukti transfer.
18. Data pesanan dan bukti transfer tampil di admin.
19. Ubah status pembayaran.

---

## Konsep Komputasi Awan yang Digunakan

### 1. Public Cloud

AWS EC2 digunakan sebagai server cloud yang dapat diakses melalui internet.

### 2. Infrastructure as a Service

AWS EC2 menyediakan virtual machine. Pengguna mengelola sistem operasi, Docker, aplikasi, dan konfigurasi server.

### 3. Virtualisasi

EC2 berjalan di atas infrastruktur virtual milik AWS.

### 4. Containerization

Docker digunakan untuk menjalankan frontend, backend, dan database dalam container terpisah.

### 5. 3-Tier Architecture

Sistem dibagi menjadi frontend, backend, dan database.

### 6. Scalability

Arsitektur ini dapat dikembangkan dengan menaikkan spesifikasi EC2, memisahkan database ke layanan khusus, atau memisahkan frontend, backend, dan database ke server berbeda.

---

## Teknologi yang Digunakan

| Teknologi | Fungsi |
|---|---|
| HTML | Struktur halaman website |
| CSS | Styling dan responsive design |
| JavaScript | Interaksi frontend, validasi form, komunikasi API |
| Node.js | Runtime backend |
| Express.js | REST API |
| Multer | Upload gambar produk dan bukti transfer |
| MySQL | Database produk, pembayaran, dan pesanan |
| Nginx | Web server frontend dan reverse proxy API |
| Docker | Containerization |
| Docker Compose | Menjalankan beberapa container sekaligus |
| GitHub | Repository project |
| AWS EC2 | Cloud server deployment |

---

## Anggota Kelompok

| Nama | Tugas |
|---|---|
| Teguh Pramudya | Frontend, GitHub, dokumentasi, deployment |
| Naessya | Backend, database, Docker, pengujian |

---

## Kesimpulan

Project **Siputra Coffee Bean** berhasil mengimplementasikan konsep komputasi awan dalam bentuk aplikasi web katalog biji kopi. Website dikembangkan menggunakan arsitektur **3-tier** yang terdiri dari frontend, backend, dan database.

Seluruh komponen dijalankan menggunakan **Docker Compose** dalam satu VM **AWS EC2**. Project juga memiliki fitur admin, pengelolaan metode pembayaran, validasi form, upload bukti transfer, serta tampilan responsive.

Dengan menggunakan Docker, GitHub, dan AWS EC2, proses pengembangan, deployment, dan pengelolaan aplikasi menjadi lebih terstruktur, fleksibel, dan sesuai dengan konsep dasar cloud computing.
