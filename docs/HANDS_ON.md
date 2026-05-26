# Hands-on Demo

1. Tampilkan struktur project.
2. Jelaskan bahwa frontend tetap memakai tampilan landing page awal.
3. Jelaskan bahwa backend dan database ditambahkan di belakang layar.
4. Jalankan `docker compose up -d --build`.
5. Cek container dengan `docker ps`.
6. Buka website melalui `http://localhost` atau `http://PUBLIC-IP-EC2`.
7. Cek API produk melalui `/api/products`.
8. Isi form pemesanan, lalu submit.
9. Cek data pesanan melalui `/api/orders`.


## Demo Admin Page

Buka halaman admin:

```text
http://localhost/admin.html
```

Demo yang dapat dilakukan:

1. Klik Refresh Produk untuk menampilkan katalog dari database.
2. Edit salah satu dari 3 produk katalog.
3. Upload foto produk JPG/PNG jika ingin mengganti foto.
4. Submit form pemesanan dari halaman user.
5. Buka admin page dan refresh pesanan.
6. Tunjukkan pesanan masuk ke tabel admin.
7. Hapus atau reset pesanan sebagai demo pengelolaan data.
