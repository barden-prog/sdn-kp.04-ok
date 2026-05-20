import React, { useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* ================= KOMPONEN PENDUKUNG (DI LUAR APP) ================= */
const SectionTitle = ({ title }) => (
  <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-2xl px-5 py-3 shadow mb-6">
    <h2 className="text-base font-black tracking-wide uppercase">{title}</h2>
  </div>
);

const InputField = ({ label, className = "", ...props }) => (
  <div className="flex flex-col md:flex-row md:items-center mb-4">
    <label className="w-full md:w-52 font-bold text-sm text-slate-700 mb-1 md:mb-0">{label}</label>
    <input
      {...props}
      className={`w-full md:flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-200 transition-all ${className}`}
    />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="flex flex-col md:flex-row md:items-center mb-4">
    <label className="w-full md:w-52 font-bold text-sm text-slate-700 mb-1 md:mb-0">{label}</label>
    <select
      {...props}
      className="w-full md:flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-200"
    >
      <option value="">-- Pilih --</option>
      {options.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  </div>
);

/* ================= KOMPONEN UTAMA ================= */
export default function App() {
  const pekerjaanList = ["Tidak Bekerja", "Petani", "Nelayan", "Wiraswasta", "Karyawan Swasta", "PNS", "TNI/POLRI", "Guru", "Pedagang", "Lainnya"];
  
  const [showLogin, setShowLogin] = useState(false);
  const [sudahSimpan, setSudahSimpan] = useState(false);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  const [form, setForm] = useState({
    sekolah: "SDN KEDUNG PENGAWAS 04",
    tahunPelajaran: "2026/2027",
    nama: "", tanggalLahir: "", nik: "", kk: "", jk: "Laki-laki",
    ayahNama: "", ibuNama: "", hp: "", maps: "", jarak: ""
  });

  // Logika Hitung Usia
  const usiaSiswa = useCallback(() => {
    if (!form.tanggalLahir) return { tahun: 0, bulan: 0, status: "-" };
    const lahir = new Date(form.tanggalLahir);
    const batas = new Date("2026-07-01");
    let tahun = batas.getFullYear() - lahir.getFullYear();
    let bulan = batas.getMonth() - lahir.getMonth();
    if (bulan < 0) { tahun--; bulan += 12; }
    let status = (tahun >= 7) ? "Prioritas" : (tahun >= 6) ? "Memenuhi Syarat" : (tahun === 5 && bulan >= 6) ? "Perlu Psikolog" : "Tidak Cukup Usia";
    return { tahun, bulan, status };
  }, [form.tanggalLahir])();

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (["nik", "kk"].includes(name)) value = value.replace(/\D/g, "").slice(0, 16);
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const ambilLokasi = () => {
    if (!navigator.geolocation) return alert("GPS tidak didukung");
    navigator.geolocation.getCurrentPosition((pos) => {
      const latSekolah = -6.157834992333592, lngSekolah = 107.04103909701671;
      const R = 6371;
      const dLat = (pos.coords.latitude - latSekolah) * Math.PI / 180;
      const dLon = (pos.coords.longitude - lngSekolah) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(latSekolah*Math.PI/180) * Math.cos(pos.coords.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
      const jarak = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
      setForm(prev => ({ ...prev, maps: `${pos.coords.latitude},${pos.coords.longitude}`, jarak }));
    }, () => alert("Gagal mengambil lokasi"));
  };

  const simpanData = async () => {
    if (!form.nama || form.nik.length !== 16 || !form.jarak) return alert("Lengkapi Nama, NIK, dan GPS!");
    setSedangMenyimpan(true);
    try {
      const { error } = await supabase.from('pendaftar').insert([{ 
        ...form, 
        jarak_rumah: parseFloat(form.jarak) 
      }]);
      if (error) throw error;
      setSudahSimpan(true);
      alert("✅ Data Berhasil Tersimpan!");
    } catch (e) { alert("Gagal: " + e.message); }
    finally { setSedangMenyimpan(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-blue-900 to-emerald-700 text-white p-8 relative">
          <button onClick={() => setShowLogin(true)} className="absolute top-6 right-6 bg-white/20 px-4 py-2 rounded-full text-xs font-bold no-print hover:bg-white/40 transition-all">👤 LOGIN ADMIN</button>
          <h1 className="text-2xl md:text-3xl font-black">PPDB ONLINE 2026</h1>
          <p className="opacity-90 font-bold uppercase tracking-wider">SDN KEDUNG PENGAWAS 04</p>
        </header>

        <div className="p-6 md:p-10 space-y-10">
          {/* I. IDENTITAS */}
          <section>
            <SectionTitle title="I. Identitas Peserta Didik" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
              <div className="space-y-1">
                <InputField label="Nama Lengkap" name="nama" value={form.nama} onChange={handleChange} />
                <InputField type="date" label="Tanggal Lahir" name="tanggalLahir" value={form.tanggalLahir} onChange={handleChange} />
                <InputField label="NIK (16 Digit)" name="nik" value={form.nik} onChange={handleChange} maxLength={16} />
              </div>
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col justify-center items-center text-center">
                <span className="text-blue-800 font-black text-xl">{usiaSiswa.tahun} Thn {usiaSiswa.bulan} Bln</span>
                <p className="text-xs font-bold text-blue-600 uppercase mt-1">{usiaSiswa.status}</p>
              </div>
            </div>
          </section>

          {/* II. DATA ORANG TUA */}
          <section>
            <SectionTitle title="II. Data Orang Tua" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded-3xl border">
                <h3 className="font-black mb-4 text-blue-800">DATA AYAH</h3>
                <InputField label="Nama Ayah" name="ayahNama" value={form.ayahNama} onChange={handleChange} />
                <SelectField label="Pekerjaan" name="ayahPekerjaan" value={form.ayahPekerjaan} onChange={handleChange} options={pekerjaanList} />
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border">
                <h3 className="font-black mb-4 text-pink-700">DATA IBU</h3>
                <InputField label="Nama Ibu" name="ibuNama" value={form.ibuNama} onChange={handleChange} />
                <SelectField label="Pekerjaan" name="ibuPekerjaan" value={form.ibuPekerjaan} onChange={handleChange} options={pekerjaanList} />
              </div>
            </div>
          </section>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col md:flex-row gap-4 justify-center pt-8 border-t no-print">
            <button onClick={ambilLokasi} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all">📍 AMBIL LOKASI GPS</button>
            <button onClick={simpanData} disabled={sedangMenyimpan} className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 transition-all disabled:bg-slate-400">
              {sedangMenyimpan ? "⏳ MENYIMPAN..." : "💾 SIMPAN PENDAFTARAN"}
            </button>
            <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-lg transition-all">🖨 CETAK PDF</button>
          </div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black mb-6 text-center">ADMIN LOGIN</h2>
            <input className="w-full border p-3 mb-3 rounded-2xl outline-none" placeholder="Username" name="username" onChange={(e) => setLoginData({...loginData, username: e.target.value})} />
            <input className="w-full border p-3 mb-6 rounded-2xl outline-none" type="password" placeholder="Password" name="password" onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
            <button onClick={() => { if(loginData.username === "admin" && loginData.password === "12345") alert("Berhasil!"); else alert("Salah!"); }} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black mb-2">MASUK</button>
            <button onClick={() => setShowLogin(false)} className="w-full text-slate-500 font-bold text-sm">BATAL</button>
          </div>
        </div>
      )}
    </div>
  );
}
