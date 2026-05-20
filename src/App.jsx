import React from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const pendidikanList = ["SD/Sederajat", "SMP/Sederajat", "SMA/Sederajat", "D1", "D2", "D3", "D4/S1", "S2", "S3"];
  const pekerjaanList = ["Tidak Bekerja", "Petani", "Nelayan", "Wiraswasta", "Karyawan Swasta", "PNS", "TNI/POLRI", "Guru", "Pedagang", "Lainnya"];
  const penghasilanList = ["< Rp500.000", "Rp500.000 - Rp999.999", "Rp1.000.000 - Rp1.999.999", "Rp2.000.000 - Rp4.999.999", "> Rp5.000.000"];

  const [showLogin, setShowLogin] = React.useState(false);
  const [sudahSimpan, setSudahSimpan] = React.useState(false);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [loginData, setLoginData] = React.useState({ username: "", password: "" });
  const [loginError, setLoginError] = React.useState("");

  const [form, setForm] = React.useState({
    sekolah: "SDN KEDUNG PENGAWAS 04",
    tahunPelajaran: "2026/2027",
    tanggalLahir: "", nama: "", jk: "Laki-laki", nisn: "", tempatLahir: "", 
    nik: "", kk: "", akta: "", agama: "Islam", kip: "Tidak", alamat: "",
    desa: "", kecamatan: "", kabupaten: "", provinsi: "", kodePos: "",
    anakKe: "", tinggal: "Orang Tua", transportasi: "Jalan Kaki", hp: "", maps: "",
    ayahNama: "", ayahNik: "", ayahTahun: "", ayahPendidikan: "", ayahPekerjaan: "", ayahPenghasilan: "",
    ibuNama: "", ibuNik: "", ibuTahun: "", ibuPendidikan: "", ibuPekerjaan: "", ibuPenghasilan: "",
    waliNama: "", waliHubungan: "", waliTtd: "",
    berat: 0, tinggi: 0, lingkar: 0, saudara: 0, hobi: "", cita: "", jarak: "", waktu: "",
    kotaTtd: "Babelan", tanggalTtd: "",
    otuTtd: "", otuNama: ""
  });

  // ✅ PERBAIKAN 1: Validasi NIK format (16 digit Indonesia)
  const isValidNIK = (nik) => {
    return nik.length === 16 && /^\d+$/.test(nik);
  };

  // ✅ PERBAIKAN 2: Validasi KK format (16 digit)
  const isValidKK = (kk) => {
    return kk.length === 16 && /^\d+$/.test(kk);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginError("");
  };

  const hitungUsia = React.useCallback(() => {
    if (!form.tanggalLahir) return { tahun: 0, bulan: 0, status: "", canSubmit: false };
    const lahir = new Date(form.tanggalLahir);
    const batas = new Date("2026-07-01");
    let tahun = batas.getFullYear() - lahir.getFullYear();
    let bulan = batas.getMonth() - lahir.getMonth();
    if (bulan < 0) { tahun--; bulan += 12; }
    
    let status = "";
    let canSubmit = false;
    
    if (tahun >= 7) {
      status = "✅ Prioritas (Usia 7 Tahun)";
      canSubmit = true;
    } else if (tahun >= 6) {
      status = "✅ Memenuhi Syarat";
      canSubmit = true;
    } else if (tahun === 5 && bulan >= 6) {
      status = "⚠️ Perlu Surat Psikolog";
      canSubmit = true;
    } else {
      status = "❌ Tidak Memenuhi Syarat (Silakan hubungi sekolah)";
      canSubmit = false;
    }
    
    return { tahun, bulan, status, canSubmit };
  }, [form.tanggalLahir]);

  const usiaSiswa = hitungUsia();

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // ✅ PERBAIKAN 3: Filter input hanya angka untuk NIK/KK
    if (name === "nik" || name === "kk") {
      value = value.replace(/\D/g, "").slice(0, 16);
    }
    
    // ✅ PERBAIKAN 4: Format nomor HP (hanya angka)
    if (name === "hp") {
      value = value.replace(/\D/g, "").slice(0, 13);
    }
    
    // ✅ PERBAIKAN 5: Format field numerik
    if (["berat", "tinggi", "lingkar", "saudara", "anakKe", "ayahTahun", "ibuTahun"].includes(name)) {
      value = value.replace(/\D/g, "");
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      alert("❌ GPS tidak didukung di browser Anda");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latSekolah = -6.157834992333592, lngSekolah = 107.04103909701671;
        const R = 6371;
        const dLat = (pos.coords.latitude - latSekolah) * Math.PI / 180;
        const dLon = (pos.coords.longitude - lngSekolah) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(latSekolah*Math.PI/180) * Math.cos(pos.coords.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
        const jarak = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
        setForm(prev => ({ ...prev, maps: `${pos.coords.latitude},${pos.coords.longitude}`, jarak }));
        alert(`✅ Lokasi terambil! Jarak: ${jarak} KM`);
      },
      (error) => {
        console.error("GPS Error:", error);
        alert(`❌ Gagal ambil lokasi: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ✅ PERBAIKAN 6: Validasi form lebih detail
  const validateForm = () => {
    const errors = [];
    
    if (!usiaSiswa.canSubmit) errors.push("❌ Usia tidak memenuhi syarat");
    if (!form.nama.trim()) errors.push("Nama lengkap harus diisi");
    if (!isValidNIK(form.nik)) errors.push("NIK harus 16 digit angka");
    if (!isValidKK(form.kk)) errors.push("Nomor KK harus 16 digit angka");
    if (!form.tanggalLahir) errors.push("Tanggal lahir harus diisi");
    if (!form.jarak) errors.push("Lokasi GPS harus diambil");
    if (!form.alamat.trim()) errors.push("Alamat harus diisi");
    if (!form.ayahNama.trim()) errors.push("Nama ayah harus diisi");
    if (!form.ibuNama.trim()) errors.push("Nama ibu harus diisi");
    if (!form.otuNama.trim()) errors.push("Nama orang tua/wali TTD harus diisi");
    if (!form.tanggalTtd) errors.push("Tanggal tanda tangan harus diisi");
    
    return errors;
  };

  const simpanData = async () => {
    // ✅ PERBAIKAN 7: Validasi lengkap sebelum simpan
    const errors = validateForm();
    if (errors.length > 0) {
      alert("⚠️ Data belum lengkap:\n\n" + errors.join("\n"));
      return;
    }

    setSedangMenyimpan(true);
    try {
      const { error } = await supabase
        .from('pendaftar')
        .insert([{ 
          ...form, 
          jarak_rumah: parseFloat(form.jarak),
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      setSudahSimpan(true);
      alert("✅ Data berhasil tersimpan!");
      // Reset form setelah simpan
      setForm(prev => ({ ...prev, nama: "", nik: "", kk: "", jarak: "", maps: "" }));
    } catch (e) {
      console.error("Save Error:", e);
      alert("❌ Gagal simpan: " + (e.message || "Unknown error"));
    } finally {
      setSedangMenyimpan(false);
    }
  };

  // ✅ PERBAIKAN 8: Login dengan validasi yang lebih baik
  const handleLogin = () => {
    setLoginError("");
    if (!loginData.username.trim() || !loginData.password.trim()) {
      setLoginError("Username dan password harus diisi");
      return;
    }
    
    // TODO: Ganti dengan autentikasi backend yang aman
    if (loginData.username === "admin" && loginData.password === "admin123") {
      window.location.hash = "/pendaftar"
    } else {
      setLoginError("❌ Username atau password salah!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <header className="bg-blue-800 text-white p-6">
          <h1 className="text-2xl font-black">PPDB SDN KEDUNG PENGAWAS 04</h1>
          <button onClick={() => setShowLogin(true)} className="mt-2 text-sm underline no-print hover:text-blue-200">Admin Login</button>
        </header>

        <div className="p-6 space-y-6">
          {/* ✅ PERBAIKAN 9: Indikator Status Usia Lengkap */}
          <div className={`p-4 rounded-2xl font-semibold text-sm border-2 no-print ${
            !form.tanggalLahir ? "bg-gray-50 border-gray-300 text-gray-600" :
            usiaSiswa.status.includes("Prioritas") ? "bg-green-100 border-green-400 text-green-800" :
            usiaSiswa.status.includes("Memenuhi") ? "bg-blue-100 border-blue-400 text-blue-800" :
            usiaSiswa.status.includes("Perlu") ? "bg-yellow-100 border-yellow-400 text-yellow-800" :
            "bg-red-100 border-red-400 text-red-800"
          }`}>
            {form.tanggalLahir ? (
              <>
                <p>📅 Usia: <strong>{usiaSiswa.tahun} tahun {usiaSiswa.bulan} bulan</strong></p>
                <p className="mt-1">{usiaSiswa.status}</p>
              </>
            ) : (
              <p>⏳ Pilih tanggal lahir untuk melihat status usia</p>
            )}
          </div>

          {/* ✅ PERBAIKAN 10: Disable form jika usia tidak memenuhi */}
          <div className={!usiaSiswa.canSubmit ? "opacity-50 pointer-events-none" : ""}>
            {!usiaSiswa.canSubmit && form.tanggalLahir && (
              <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-2xl mb-4 font-semibold">
                ⛔ Form tidak dapat diisi. Usia calon siswa tidak memenuhi syarat untuk PPDB tahun ini. <br/>
                <span className="text-sm mt-2 block">Silakan hubungi sekolah untuk informasi lebih lanjut.</span>
              </div>
            )}

            <SectionTitle title="IDENTITAS SISWA" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="date" label="Tgl Lahir *"name="tanggalLahir"value={form.tanggalLahir} onChange={handleChange} required />
              <Input label="Nama Lengkap *" name="nama" value={form.nama} onChange={handleChange} required disabled={!usiaSiswa.canSubmit} />
              <Input label="NIK (16 Digit) *" name="nik" value={form.nik} onChange={handleChange} placeholder="Contoh: 3201021234567890" disabled={!usiaSiswa.canSubmit} />
              <Input label="No. KK (16 Digit) *" name="kk" value={form.kk} onChange={handleChange} placeholder="Contoh: 3201021234567890" disabled={!usiaSiswa.canSubmit} />
              <Input label="No. Akta Lahir" name="akta" value={form.akta} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="NISN" name="nisn" value={form.nisn} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Tempat Lahir" name="tempatLahir" value={form.tempatLahir} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Jenis Kelamin" name="jk" value={form.jk} onChange={handleChange} as="select" options={["Laki-laki", "Perempuan"]} disabled={!usiaSiswa.canSubmit} />
            </div>

            <SectionTitle title="ALAMAT & LOKASI" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Alamat Lengkap *" name="alamat" value={form.alamat} onChange={handleChange} required disabled={!usiaSiswa.canSubmit} />
              <Input label="Desa/Kelurahan" name="desa" value={form.desa} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Kecamatan" name="kecamatan" value={form.kecamatan} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Kabupaten/Kota" name="kabupaten" value={form.kabupaten} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Provinsi" name="provinsi" value={form.provinsi} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Kode Pos" name="kodePos" value={form.kodePos} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="No. HP/Telepon" name="hp" value={form.hp} onChange={handleChange} placeholder="Contoh: 081234567890" disabled={!usiaSiswa.canSubmit} />
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 no-print">
              <p className="text-sm font-bold mb-2">📍 Lokasi GPS: {form.jarak ? `${form.jarak} KM dari sekolah` : "❌ Belum diambil"}</p>
              <button onClick={ambilLokasi} disabled={!usiaSiswa.canSubmit} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl font-bold transition">
                📍 Ambil Lokasi GPS
              </button>
            </div>

            <SectionTitle title="DATA ORANG TUA" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <h3 className="font-bold text-blue-700 mb-3 text-lg">👨 DATA AYAH</h3>
                <Input label="Nama Lengkap *" name="ayahNama" value={form.ayahNama} onChange={handleChange} required disabled={!usiaSiswa.canSubmit} />
                <Input label="NIK" name="ayahNik" value={form.ayahNik} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
                <Input label="Tahun Lahir" name="ayahTahun" value={form.ayahTahun} onChange={handleChange} placeholder="Contoh: 1970" disabled={!usiaSiswa.canSubmit} />
                <Input label="Pendidikan" name="ayahPendidikan" value={form.ayahPendidikan} onChange={handleChange} as="select" options={["", ...pendidikanList]} disabled={!usiaSiswa.canSubmit} />
                <Input label="Pekerjaan" name="ayahPekerjaan" value={form.ayahPekerjaan} onChange={handleChange} as="select" options={["", ...pekerjaanList]} disabled={!usiaSiswa.canSubmit} />
                <Input label="Penghasilan" name="ayahPenghasilan" value={form.ayahPenghasilan} onChange={handleChange} as="select" options={["", ...penghasilanList]} disabled={!usiaSiswa.canSubmit} />
              </div>
              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200">
                <h3 className="font-bold text-pink-700 mb-3 text-lg">👩 DATA IBU</h3>
                <Input label="Nama Lengkap *" name="ibuNama" value={form.ibuNama} onChange={handleChange} required disabled={!usiaSiswa.canSubmit} />
                <Input label="NIK" name="ibuNik" value={form.ibuNik} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
                <Input label="Tahun Lahir" name="ibuTahun" value={form.ibuTahun} onChange={handleChange} placeholder="Contoh: 1972" disabled={!usiaSiswa.canSubmit} />
                <Input label="Pendidikan" name="ibuPendidikan" value={form.ibuPendidikan} onChange={handleChange} as="select" options={["", ...pendidikanList]} disabled={!usiaSiswa.canSubmit} />
                <Input label="Pekerjaan" name="ibuPekerjaan" value={form.ibuPekerjaan} onChange={handleChange} as="select" options={["", ...pekerjaanList]} disabled={!usiaSiswa.canSubmit} />
                <Input label="Penghasilan" name="ibuPenghasilan" value={form.ibuPenghasilan} onChange={handleChange} as="select" options={["", ...penghasilanList]} disabled={!usiaSiswa.canSubmit} />
              </div>
            </div>

            <SectionTitle title="DATA WALI (JIKA ADA)" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Wali" name="waliNama" value={form.waliNama} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Hubungan dengan Siswa" name="waliHubungan" value={form.waliHubungan} onChange={handleChange} placeholder="Contoh: Nenek, Kakek, Paman, dll" disabled={!usiaSiswa.canSubmit} />
            </div>

            <SectionTitle title="DATA TAMBAHAN" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Agama" name="agama" value={form.agama} onChange={handleChange} as="select" options={["Islam", "Kristen", "Katholik", "Hindu", "Buddha", "Konghucu"]} disabled={!usiaSiswa.canSubmit} />
              <Input label="Anak ke-" name="anakKe" value={form.anakKe} onChange={handleChange} type="number" disabled={!usiaSiswa.canSubmit} />
              <Input label="Tinggal dengan" name="tinggal" value={form.tinggal} onChange={handleChange} as="select" options={["Orang Tua", "Nenek/Kakek", "Wali", "Lainnya"]} disabled={!usiaSiswa.canSubmit} />
              <Input label="Transportasi" name="transportasi" value={form.transportasi} onChange={handleChange} as="select" options={["Jalan Kaki", "Sepeda", "Motor", "Mobil", "Angkot", "Bis"]} disabled={!usiaSiswa.canSubmit} />
              <Input label="Berat Badan (kg)" name="berat" value={form.berat} onChange={handleChange} type="number" disabled={!usiaSiswa.canSubmit} />
              <Input label="Tinggi Badan (cm)" name="tinggi" value={form.tinggi} onChange={handleChange} type="number" disabled={!usiaSiswa.canSubmit} />
              <Input label="Lingkar Kepala (cm)" name="lingkar" value={form.lingkar} onChange={handleChange} type="number" disabled={!usiaSiswa.canSubmit} />
              <Input label="Jumlah Saudara" name="saudara" value={form.saudara} onChange={handleChange} type="number" disabled={!usiaSiswa.canSubmit} />
              <Input label="Hobi" name="hobi" value={form.hobi} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
              <Input label="Cita-cita" name="cita" value={form.cita} onChange={handleChange} disabled={!usiaSiswa.canSubmit} />
            </div>

            {/* ✅ PERBAIKAN 11: Kotak Tanda Tangan yang Rapi */}
            <SectionTitle title="TANDA TANGAN" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kolom 1: Tempat & Tanggal */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-300">
                <h3 className="font-bold text-gray-800 text-center mb-4">📅 TEMPAT & TANGGAL</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    name="kotaTtd"
                    value={form.kotaTtd} 
                    onChange={handleChange}
                    disabled={!usiaSiswa.canSubmit}
                    className="w-full p-2 bg-white border border-gray-300 rounded text-center text-sm font-semibold"
                    placeholder="Kota"
                  />
                  <input 
                    type="date" 
                    name="tanggalTtd"
                    value={form.tanggalTtd} 
                    onChange={handleChange}
                    disabled={!usiaSiswa.canSubmit}
                    className="w-full p-2 bg-white border border-gray-300 rounded text-center text-sm"
                  />
                  <p className="text-xs text-center text-gray-600 font-semibold">
                    {form.kotaTtd}, {form.tanggalTtd || "___________"}
                  </p>
                </div>
              </div>

              {/* Kolom 2: Orang Tua/Wali */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-300">
                <h3 className="font-bold text-purple-800 text-center mb-4">👨‍👩‍👧 ORANG TUA/WALI MURID</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    name="otuNama"
                    placeholder="Nama Lengkap" 
                    value={form.otuNama} 
                    onChange={handleChange}
                    disabled={!usiaSiswa.canSubmit}
                    className="w-full p-2 bg-white border border-purple-300 rounded text-center text-sm font-semibold"
                  />
                  <div className="border-t-2 border-purple-400 pt-4 h-24 flex items-center justify-center">
                    <span className="text-slate-400 text-xs">Tanda Tangan</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Hubungan (Ayah/Ibu/Wali)" 
                    value={form.otuTtd} 
                    onChange={(e) => setForm(prev => ({ ...prev, otuTtd: e.target.value }))}
                    disabled={!usiaSiswa.canSubmit}
                    className="w-full p-2 border border-purple-300 rounded text-sm text-center text-slate-600"
                  />
                </div>
              </div>

              {/* Kolom 3: Mengetahui TIM */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border-2 border-emerald-300">
                <h3 className="font-bold text-emerald-800 text-center mb-4">📋 MENGETAHUI<br/>TIM SPMB</h3>
                <div className="space-y-4">
                  <p className="text-center text-sm text-emerald-700 italic font-semibold">SDN KEDUNG PENGAWAS 04</p>
                  <div className="border-t-2 border-emerald-400 pt-4 h-24 flex items-center justify-center">
                    <span className="text-slate-400 text-xs">Tanda Tangan</span>
                  </div>
                  <div className="h-6"></div>
                  <p className="text-center text-xs text-emerald-700 font-semibold">_______________________</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-2xl mt-4">
              <p className="text-sm text-yellow-800 font-semibold">💡 Catatan: Pastikan semua tanda tangan sudah lengkap sebelum mencetak dan menyimpan dokumen.</p>
            </div>

            {/* ✅ PERBAIKAN 12: CATATAN KEPADA PESERTA DIDIK BARU */}
            <SectionTitle title="📝 CATATAN KEPADA PESERTA DIDIK BARU" />
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-4 border-orange-400 p-6 rounded-2xl shadow-lg">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl font-bold text-orange-600 flex-shrink-0">1.</span>
                  <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                    Lampirkan <span className="font-bold text-orange-700">Fotocopy KK &amp; Fotocopy KTP Orang Tua</span>
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl font-bold text-orange-600 flex-shrink-0">2.</span>
                  <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                    Lampirkan <span className="font-bold text-orange-700">Fotocopy Akte Kelahiran</span> (Jika ada)
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl font-bold text-orange-600 flex-shrink-0">3.</span>
                  <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                    Tulislah Formulir PPDB ini dengan <span className="font-bold text-orange-700">TULISAN yang Jelas</span><br/>
                    <span className="text-xs text-gray-600 italic">(untuk memudahkan Pengenterian di Aplikasi DAPODIK)</span>
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl font-bold text-orange-600 flex-shrink-0">4.</span>
                  <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                    Jika berasal dari <span className="font-bold text-orange-700">TK / KB</span> agar melampirkan <span className="font-bold text-orange-700">Fotocopy IJAZAH</span>
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl font-bold text-orange-600 flex-shrink-0">5.</span>
                  <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                    Susunlah Berkas-berkas tersebut lalu di <span className="font-bold text-orange-700">streples dijadikan satu</span> kemudian masukan kedalam <span className="font-bold text-orange-700">Map Pendaftaran</span>
                  </p>
                </div>
              </div>
              
              {/* Terima Kasih */}
              <div className="mt-6 pt-6 border-t-2 border-orange-300 text-center">
                <p className="text-lg font-black text-orange-700 tracking-wider">
                  🙏 TERIMA KASIH 🙏
                </p>
              </div>
            </div>

            {sudahSimpan && (
              <div className="bg-green-100 border border-green-400 text-green-800 p-4 rounded-2xl font-semibold">
                ✅ Data telah tersimpan! Silakan cetak atau submit ulang jika diperlukan.
              </div>
            )}

            <div className="flex gap-4 pt-6 no-print flex-wrap">
              <button onClick={() => window.print()} disabled={!usiaSiswa.canSubmit} className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-bold transition">
                🖨 Cetak PDF
              </button>
              <button 
                onClick={simpanData} 
                disabled={sedangMenyimpan || !usiaSiswa.canSubmit}
                className={`px-6 py-3 rounded-xl font-bold transition ${
                  sedangMenyimpan || !usiaSiswa.canSubmit
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {sedangMenyimpan ? "⏳ Menyimpan..." : "💾 Simpan Data"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ PERBAIKAN 13: Modal Login yang diperbaiki */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl">
            <h2 className="font-bold text-lg mb-4">🔐 Admin Login</h2>
            
            {loginError && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded-xl mb-4 text-sm">
                {loginError}
              </div>
            )}
            
            <input 
              className="w-full border border-slate-300 p-2 mb-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
              placeholder="Username" 
              name="username" 
              value={loginData.username}
              onChange={handleLoginChange}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            <input 
              className="w-full border border-slate-300 p-2 mb-4 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
              type="password" 
              placeholder="Password" 
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            
            <button 
              onClick={handleLogin} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold transition"
            >
              Login
            </button>
            <button 
              onClick={() => {
                setShowLogin(false);
                setLoginData({ username: "", password: "" });
                setLoginError("");
              }} 
              className="w-full mt-2 border border-slate-300 py-2 rounded font-bold hover:bg-slate-50 transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SectionTitle = ({ title }) => (
  <div className="bg-slate-700 text-white px-4 py-2 rounded-xl font-bold text-sm mt-6">{title}</div>
);

const Input = ({ label, as = "input", options = [], disabled = false, ...props }) => {
  if (as === "select") {
    return (
      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-600 mb-1">
          {label}
          {props.required && <span className="text-red-600">*</span>}
        </label>
        <select 
          {...props}
          disabled={disabled}
          className={`border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-600 mb-1">
        {label}
        {props.required && <span className="text-red-600">*</span>}
      </label>
      <input 
        {...props}
        disabled={disabled}
        className={`border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />
    </div>
  );
};
