import qrcode
from PIL import Image

# 1. Konfigurasi Data dan File
url = "https://tricatur.imskuy.my.id"
logo_path = "favicon.png"  # <-- Sudah diganti ke favicon.png
output_path = "qrcode_transparent_1024.png"
TARGET_SIZE = 1024

# 2. Generate QR Code dasar
qr = qrcode.QRCode(
    version=3,
    error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
    box_size=10,
    border=4,
)
qr.add_data(url)
qr.make(fit=True)

# 3. Buat gambar QR dengan background TRANSPARAN
qr_img = qr.make_image(fill_color="black", back_color="transparent").convert("RGBA")

# 4. Resize QR ke 1024x1024 (Gunakan NEAREST agar kotak QR tetap tajam/pixelated, tidak blur)
qr_img = qr_img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.NEAREST)

try:
    # 5. Proses Tempel Logo
    logo = Image.open(logo_path).convert("RGBA")

    # Hitung ukuran logo (22% dari 1024 pixel = ~225x225 pixel)
    logo_max_size = int(TARGET_SIZE * 0.22)

    # Resize logo dengan kualitas tinggi
    logo.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
    logo_width, logo_height = logo.size

    # Hitung posisi koordinat tengah
    pos_x = (TARGET_SIZE - logo_width) // 2
    pos_y = (TARGET_SIZE - logo_height) // 2

    # Tempel logo ke atas QR code menggunakan alpha channel sebagai mask
    qr_img.paste(logo, (pos_x, pos_y), logo)
    print("Logo favicon.png berhasil ditempel di tengah!")

except FileNotFoundError:
    print(f"Peringatan: File {logo_path} tidak ditemukan. QR dibuat tanpa logo.")

# 6. Simpan Hasil Akhir
qr_img.save(output_path)
print(f"QR Code transparan (1024x1024) berhasil disimpan di: {output_path}")
