import qrcode
from PIL import Image

def generate_qr_1024(data, logo_path, output_path="qr_1024.png"):
    # 1. Konfigurasi dasar QR Code (Gunakan versi lebih tinggi agar pola lebih rapat jika diinginkan)
    qr = qrcode.QRCode(
        version=5,
        error_correction=qrcode.constants.ERROR_CORRECT_H, # Toleransi error 30% untuk logo
        box_size=10,
        border=4,
    )

    qr.add_data(data)
    qr.make(fit=True)

    # 2. Buat gambar QR Code dasar
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

    # 3. Paksa ukuran QR Code menjadi tepat 1024x1024 piksel
    target_size = 1024
    qr_img = qr_img.resize((target_size, target_size), Image.Resampling.NEAREST)

    # 4. Buka dan sesuaikan ukuran logo (maksimal 20-25% dari ukuran QR agar aman dipindai)
    logo = Image.open(logo_path)
    logo_size = int(target_size * 0.22) # 22% dari 1024 piksel
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    # 5. Hitung posisi tengah yang presisi
    x_pos = (target_size - logo_size) // 2
    y_pos = (target_size - logo_size) // 2

    # 6. Tempelkan logo ke QR Code
    qr_img.paste(logo, (x_pos, y_pos), mask=logo if logo.mode == 'RGBA' else None)

    # 7. Simpan hasil akhir
    qr_img.save(output_path)
    print(f"QR Code 1024x1024 berhasil disimpan di {output_path}")


# --- Cara Penggunaan ---
if __name__ == "__main__":
    generate_qr_1024("https://absent.imskuy.my.id", "favicon.png")
