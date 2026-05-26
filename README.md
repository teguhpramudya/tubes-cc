# Landing Page Katalog Biji Kopi Menggunakan Docker, GitHub, dan AWS EC2

Project ini merupakan tugas besar mata kuliah **Komputasi Awan**. Website yang digunakan adalah landing page katalog biji kopi dengan tampilan awal yang tetap dipertahankan, tetapi sistemnya dikembangkan menjadi arsitektur **3-tier**, yaitu frontend, backend, dan database.

Project ini menggunakan **Docker Compose** untuk menjalankan seluruh service dalam container, lalu di deploy pada **AWS EC2** sebagai cloud server.

---

## Deskripsi Project

Website ini menampilkan katalog produk biji kopi dan form pemesanan. Sistem dikembangkan agar lebih sesuai dengan konsep komputasi awan dan arsitektur aplikasi modern.

Perubahan utama pada project ini:

- Data produk kopi diambil dari database melalui backend API.
- Form pemesanan dikirim ke backend dan disimpan ke database.
- Admin dapat menambah, mengedit, menghapus produk, dan mengelola pesanan.
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
```

Admin page tetap berada pada **frontend container**, sehingga deployment tetap menggunakan **1 VM AWS EC2**.

```text
1 VM AWS EC2
├── frontend container
│   ├── index.html
│   └── admin.html
├── backend container
└── database container
```

---

## Pembagian Layer

| Layer | Fungsi | Teknologi |
|---|---|---|
| Frontend | Menampilkan landing page, katalog produk, form pemesanan, dan admin page | HTML, CSS, JavaScript, Nginx |
| Backend | Menyediakan API produk, API pesanan, dan upload gambar | Node.js, Express, Multer |
| Database | Menyimpan data produk dan data pesanan | MySQL |
| Cloud Server | Menjalankan seluruh container | AWS EC2 Ubuntu |
| Containerization | Mengemas dan menjalankan service | Docker, Docker Compose |

---

## Endpoint Backend

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Mengecek status backend dan database |
| GET | `/api/products` | Mengambil data produk kopi dari database |
| POST | `/api/products` | Menambah produk kopi baru |
| PUT | `/api/products/:id` | Mengedit produk kopi |
| DELETE | `/api/products/:id` | Menghapus produk kopi |
| POST | `/api/upload` | Upload gambar produk format JPG/JPEG/PNG |
| POST | `/api/orders` | Menyimpan data pesanan dari form |
| GET | `/api/orders` | Melihat data pesanan yang masuk |
| DELETE | `/api/orders/:id` | Menghapus satu pesanan |
| DELETE | `/api/orders` | Reset semua pesanan |

---

## Admin Page

Admin page dapat digunakan untuk mengelola katalog kopi dan data pesanan.

Akses admin page:

```text
http://localhost/admin.html
```

Fitur admin page:

- Melihat 3 katalog produk yang tampil di halaman user.
- Mengedit nama, asal, roasting, rasa, berat, harga, deskripsi, dan foto produk.
- Menambah produk kopi baru.
- Upload foto produk dalam format JPG, JPEG, atau PNG.
- Menghapus produk dari katalog.
- Melihat data pesanan yang masuk dari form user.
- Menghapus satu pesanan atau reset semua pesanan.

Foto produk yang diupload admin akan disimpan oleh backend dan ditampilkan melalui route `/uploads/`.

---

## Folder Tree

```text
tubes-cc/
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── img/
│   │   └── js/
│   │       ├── script.js
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
├── docs/
│   └── HANDS_ON.md
│
├── docker-compose.yml
├── .gitignore
├── .dockerignore
└── README.md
```

---

## Cara Menjalankan di Local

Pastikan **Docker Desktop** sudah terinstall dan sedang berjalan.

Clone repository:

```bash
git clone https://github.com/teguhpramudya/tubes-cc.git
cd tubes-cc
```

Build dan jalankan semua container:

```bash
docker compose up -d --build
```

Cek container yang berjalan:

```bash
docker ps
```

Akses website user:

```text
http://localhost
```

Akses admin page:

```text
http://localhost/admin.html
```

Cek backend API:

```text
http://localhost/api/health
http://localhost/api/products
```

Menghentikan container:

```bash
docker compose down
```

Menghapus container sekaligus volume database:

```bash
docker compose down -v
```

---

## Cara Deploy ke AWS EC2

### 1. Membuat EC2 Instance

Gunakan konfigurasi sederhana berikut:

| Komponen | Rekomendasi |
|---|---|
| AMI | Ubuntu Server |
| Instance Type | t2.micro / t3.micro |
| Storage | 8 GB atau lebih |
| Security Group | Buka port 22 dan 80 |

Port yang perlu dibuka:

| Port | Fungsi |
|---|---|
| 22 | SSH ke server EC2 |
| 80 | Akses website dari browser |

### 2. Login ke EC2

```bash
ssh -i nama-key.pem ubuntu@PUBLIC-IP-EC2
```

### 3. Install Docker, Docker Compose, dan Git

```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin git -y
sudo systemctl start docker
sudo systemctl enable docker
```

Agar Docker bisa dijalankan tanpa `sudo`:

```bash
sudo usermod -aG docker ubuntu
```

Setelah menjalankan command di atas, logout dari server lalu login kembali.

### 4. Clone Repository dari GitHub

```bash
git clone https://github.com/teguhpramudya/tubes-cc.git
cd tubes-cc
```

### 5. Jalankan Project di AWS EC2

```bash
docker compose up -d --build
```

Cek container:

```bash
docker ps
```

### 6. Akses Website

Buka browser:

```text
http://PUBLIC-IP-EC2
```

Admin page:

```text
http://PUBLIC-IP-EC2/admin.html
```

---

## Command Hands-on untuk Demo

Cek isi folder project:

```bash
ls
```

Jalankan seluruh service:

```bash
docker compose up -d --build
```

Cek container:

```bash
docker ps
```

Cek log backend:

```bash
docker logs katalog-kopi-backend
```

Cek API produk:

```bash
curl http://localhost/api/products
```

Cek API health:

```bash
curl http://localhost/api/health
```

Masuk ke database:

```bash
docker compose exec db mysql -u kopi_user -pkopi_password katalog_kopi
```

Melihat data pesanan:

```sql
SELECT * FROM orders;
```

Melihat data produk:

```sql
SELECT * FROM products;
```

Keluar dari MySQL:

```sql
exit;
```

Menghentikan semua container:

```bash
docker compose down
```

---

## Konsep Komputasi Awan yang Digunakan

### 1. Public Cloud

AWS EC2 digunakan sebagai server cloud yang dapat diakses melalui internet. Website dapat dibuka oleh user melalui public IP dari instance EC2.

### 2. Infrastructure as a Service

AWS EC2 termasuk layanan IaaS karena menyediakan infrastruktur berupa virtual machine. Pengguna dapat mengelola sistem operasi, Docker, aplikasi, dan konfigurasi server sendiri.

### 3. Virtualisasi

EC2 berjalan di atas infrastruktur virtual milik AWS. Dengan virtualisasi, satu infrastruktur fisik dapat digunakan untuk menjalankan banyak virtual machine.

### 4. Containerization

Docker digunakan untuk menjalankan frontend, backend, dan database dalam container yang terisolasi. Dengan container, aplikasi lebih mudah dijalankan secara konsisten di local maupun cloud.

### 5. 3 Architecture

Sistem dibagi menjadi tiga bagian utama:

- Frontend sebagai tampilan aplikasi.
- Backend sebagai pengolah request dan penyedia API.
- Database sebagai penyimpanan data produk dan pesanan.

### 6. Scalability

Arsitektur ini dapat dikembangkan lebih lanjut dengan menaikkan spesifikasi server, menambah container, atau memisahkan frontend, backend, dan database ke VM yang berbeda.

---

## Teknologi yang Digunakan

| Teknologi | Fungsi |
|---|---|
| HTML | Membuat struktur halaman website |
| CSS | Mengatur tampilan landing page dan admin page |
| JavaScript | Menghubungkan frontend dengan backend API |
| Node.js | Menjalankan backend |
| Express.js | Membuat REST API |
| Multer | Mengelola upload gambar produk |
| MySQL | Menyimpan data produk dan pesanan |
| Nginx | Web server untuk frontend |
| Docker | Membuat container aplikasi |
| Docker Compose | Menjalankan beberapa container sekaligus |
| GitHub | Menyimpan repository project |
| AWS EC2 | Cloud server untuk deployment |

---

## Anggota Kelompok

| Nama | Tugas |
|---|---|
| Teguh Pramudya | Frontend, Backend, Database, GitHub Repository  |
| Naessya | Docker, Deployment AWS |

---

## Kesimpulan

Project ini menunjukkan implementasi komputasi awan dalam bentuk aplikasi katalog biji kopi berbasis web. Website dikembangkan menggunakan arsitektur 3-tier yang terdiri dari frontend, backend, dan database. Seluruh komponen dijalankan menggunakan Docker Compose pada satu VM AWS EC2 sehingga aplikasi dapat diakses melalui internet.

Dengan menggunakan Docker, GitHub, dan AWS EC2, proses pengembangan, deployment, dan pengelolaan aplikasi menjadi lebih terstruktur, fleksibel, dan sesuai dengan konsep dasar komputasi awan.
