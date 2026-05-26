# Landing Page Katalog Biji Kopi Menggunakan Docker, GitHub, dan AWS EC2

Project ini merupakan tugas besar mata kuliah **Komputasi Awan**. Website yang digunakan tetap berupa landing page katalog biji kopi dengan tampilan awal yang sama, tetapi bagian sistemnya dikembangkan menjadi arsitektur **frontend, backend, dan database**.

## Deskripsi Project

Website menampilkan katalog produk biji kopi Arabika dan form pemesanan. Frontend tetap menggunakan tampilan landing page yang sudah dibuat sebelumnya. Perubahan utama ada pada sisi implementasi cloud:

- Data produk diambil dari database melalui backend API.
- Data pemesanan dari form disimpan ke database.
- Setiap komponen dijalankan dalam container Docker.
- Semua container dijalankan pada satu VM AWS EC2 menggunakan Docker Compose.

## Arsitektur Sistem

Project ini menggunakan pilihan implementasi **1 VM AWS EC2 dengan 3 container Docker**.

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

## Pembagian Layer

| Layer | Fungsi | Teknologi |
|---|---|---|
| Frontend | Menampilkan landing page, katalog produk, dan form pemesanan | HTML, CSS, JavaScript, Nginx |
| Backend | Menyediakan API produk dan API pemesanan | Node.js, Express |
| Database | Menyimpan data produk dan data pesanan | MySQL |
| Cloud Server | Menjalankan seluruh container | AWS EC2 Ubuntu |
| Containerization | Mengemas dan menjalankan service | Docker, Docker Compose |

## Endpoint Backend

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Mengecek status backend dan database |
| GET | `/api/products` | Mengambil data produk kopi dari database |
| POST | `/api/orders` | Menyimpan data pesanan dari form |
| GET | `/api/orders` | Melihat data pesanan yang masuk |

## Struktur Folder

```text
tubes-cc-3tier-original-ui/
├── frontend/
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── img/
│   │   └── js/
│   │       └── script.js
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
├── .gitignore
├── .dockerignore
└── README.md
```

## Cara Menjalankan di Local

Pastikan Docker dan Docker Compose sudah terinstall.

Build dan jalankan semua container:

```bash
docker compose up -d --build
```

Cek container yang berjalan:

```bash
docker ps
```

Akses website:

```text
http://localhost
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

## Cara Deploy ke AWS EC2

### 1. Buat EC2 Instance

Gunakan konfigurasi sederhana:

| Komponen | Rekomendasi |
|---|---|
| AMI | Ubuntu Server |
| Instance type | t2.micro / t3.micro |
| Storage | 8 GB atau lebih |
| Security Group | Buka port 22 dan 80 |

Port yang dibuka:

| Port | Fungsi |
|---|---|
| 22 | SSH ke server EC2 |
| 80 | Akses website dari browser |

### 2. Login ke EC2

```bash
ssh -i nama-key.pem ubuntu@PUBLIC-IP-EC2
```

### 3. Install Docker dan Docker Compose

```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin git -y
sudo systemctl start docker
sudo systemctl enable docker
```

Agar bisa menjalankan docker tanpa `sudo`:

```bash
sudo usermod -aG docker ubuntu
```

Logout lalu login kembali ke server.

### 4. Clone Repository dari GitHub

```bash
git clone https://github.com/USERNAME/NAMA-REPO.git
cd NAMA-REPO
```

### 5. Jalankan Project

```bash
docker compose up -d --build
```

### 6. Akses Website

Buka browser:

```text
http://PUBLIC-IP-EC2
```

## Command Hands-on untuk Demo

```bash
# cek isi folder project
ls

# jalankan seluruh service
docker compose up -d --build

# cek container

docker ps

# cek log backend

docker logs katalog-kopi-backend

# cek API produk
curl http://localhost/api/products

# cek API health
curl http://localhost/api/health
```

## Konsep Komputasi Awan yang Digunakan

Project ini menerapkan konsep berikut:

1. **Public Cloud**  
   AWS EC2 digunakan sebagai server cloud yang dapat diakses melalui internet.

2. **IaaS**  
   AWS EC2 menyediakan virtual machine atau server virtual untuk menjalankan aplikasi.

3. **Virtualisasi**  
   EC2 berjalan di atas infrastruktur virtual milik AWS.

4. **Containerization**  
   Docker digunakan untuk menjalankan frontend, backend, dan database dalam container yang terisolasi.

5. **3-Tier Architecture**  
   Sistem dibagi menjadi frontend, backend, dan database agar struktur aplikasi lebih jelas.

6. **Scalability**  
   Arsitektur ini dapat dikembangkan lebih lanjut dengan menambah container atau menaikkan spesifikasi server.

## Catatan

Tampilan website tidak ditambahkan section arsitektur atau teknologi agar tetap sama seperti versi landing page awal. Penjelasan arsitektur, teknologi, dan cloud deployment hanya ditempatkan pada README ini.
