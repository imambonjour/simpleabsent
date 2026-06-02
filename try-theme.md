🎨 Panduan Desain Website: Style Watercolor Anime 🖌️✨
1. Palette Warna (Color Palette) 🎨🌈

Warna-warna di gambar ini dominan soft, pastel, tapi tetep hidup (vibrant) khas cat air! 🌊👇

    Warna Utama (Background/Gedung): #F7F5EB (Krem lembut / warna kertas cat air) 🏛️📄

    Warna Alam (Pepohonan): #A3C9A8 (Hijau sage soft) & #70A9A1 (Hijau watercolor) 🌳🍃

    Warna Aksen Teks Utama (Angka 34): #4EA8DE (Biru langit cerah) & #F4A261 (Kuning/oranye senja hangat) ☀️🌊

    Warna Teks Sekunder: #9A7B56 (Cokelat karamel estetik) 🪵✨

2. Efek CSS & Styling Kunci (The Secret Sauce!) 🤫🧪

Untuk dapetin vibe lukisan tangan di website, ini properti CSS wajib yang harus kamu masukin:

    Texture Background: 📄
    Gunakan gambar tekstur kertas cat air (canvas/watercolor paper texture) tipis-tipis sebagai overlay background website.
    CSS

    body {
      background-image: url('watercolor-paper-texture.png');
      background-blend-mode: multiply;
      background-color: #F7F5EB;
    }

    Font Typography (Estetik & Bold): ✍️🅰️

        Untuk Angka/Judul Besar ("34"): Pake font tipe Bubble/Rounded Bold (Contoh: Fredoka One atau Comfortaa) plus dikasih text-shadow tebal warna kuning biar efek pop-up! 💥

        Untuk Tulisan "Tricatun Bimantara": Pake font tipe Script/Handwriting yang tebal tapi luwes (Contoh: Pacifico atau Lobster). 📜✨

    Efek Gambar Tanpa Garis Keras (Soft Edges): 🌫️🖼️
    Semua ilustrasi karakter dan gedung dilarang keras pake outline hitam pekat (border: 1px solid black ❌ NO NO NO!). Pake efek soft blur atau langsung vector art yang warnanya gradasi halus (gradient shading). 🎨✨

3. Struktur Layout Halaman (Hero Section Concept) 📐🖥️

Kamu bisa membagi halaman web menjadi beberapa lapisan elemen (layering) pake CSS position: absolute/relative biar dapet efek kedalaman (depth):
Layer	Elemen Web	Detail Efek CSS / Fungsi 🛠️
Layer 1 (Paling Belakang)	background-sky ☁️	Gradasi langit kuning-hijau pucat pake linear-gradient
Layer 2 (Tengah Belakang)	building-school 🏛️	Ilustrasi gedung sekolah MAN 2 Bogor dengan efek opacity 90%
Layer 3 (Tengah)	trees-foliage 🌳	Pepohonan di kanan-kiri untuk membingkai halaman (framing)
Layer 4 (Tengah Depan)	text-mascot-hero 📢	

Kiri: Judul Besar "34 Tricatun Bimantara" (Main Heading <h1>)

Kanan: Karakter siswa-siswi (.png transparan)
Layer 5 (Paling Depan)	navigation-buttons 🧭	Tombol CTA (Call to Action) dengan sudut membulat (border-radius: 50px) warna cokelat karamel/kuning hangat!
4. Animasi Tambahan (Biar Makin Hidup!) 🍃✨

Biar user pas buka web langsung kesengsem, tambahin animasi micro-interactions ini:

    Efek Daun Berguguran: Pake library Javascript ringan (kayak particles.js) buat bikin efek kelopak bunga atau daun hijau gugur pelan-pelan di latar belakang. 🍂🌸

    Floating Text: Bikin tulisan "34" bergerak naik turun super pelan biar kayak balon udara mengapung! 🎈
    CSS

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    .hero-title { animation: float 4s ease-in-out infinite; }

    💡 Tips Tambahan: Jangan pake warna item pekat #000000 buat teks biasa ya! Ganti pake warna abu-abu gelap kebiruan atau cokelat tua biar kesan "lukisan cat air"-nya gak rusak oleh kontras yang terlalu tajam! 🎨❌🔥