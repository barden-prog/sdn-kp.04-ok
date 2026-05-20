import React, { useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

/* ================= COMPONENT REUSABLE (DI LUAR APP) ================= */
const SectionTitle = ({ title }) => (
  <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm mb-6 shadow-sm uppercase tracking-wide">
    {title}
  </div>
);

const InputField = ({ label, className = "", ...props }) => (
  <div className="flex flex-col mb-4">
    <label className="text-xs font-black text-slate-500 mb-1.5 ml-1 uppercase">{label}</label>
    <input
      {...props}
      className={`border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-400 ${className}`}
    />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="flex flex-col mb-4">
    <label className="text-xs font-black text-slate-500 mb-1.5 ml-1 uppercase">{label}</label>
    <select
      {...props}
      className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white"
    >
      <option value="">-- Pilih {label} --</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

/* ================= MAIN APPLICATION ================= */
export default function App() {
  const navigate = useNavigate();
  
  // Master Data
  const pekerjaanList = ["Tidak Bekerja", "Petani", "Nelayan", "Wiraswasta", "Karyawan Swasta", "PNS", "TNI/POLRI", "Guru", "Pedagang", "Lainnya"];
  
  // States
  const [showLogin, setShowLogin] = useState(false);
  const [sudahSimpan, setSudahSimpan] = useState(false);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  const [form, setForm] = useState({
    sekolah: "SDN KEDUNG PENGAWAS 04",
    tahunPelajaran: "2026/2027",
    nama: "", jk: "Laki-laki", nisn: "", tempatLahir: "", tanggalLahir: "",
    nik: "", kk: "", akta: "", agama: "Islam", kip: "Tidak", alamat: "",
    ayahNama: "", ayahNik: "", ayahPekerjaan: "",
    ibuNama: "", ibuNik: "", ibuPekerjaan: "",
    berat: "", tinggi: "", lingkar: "", saudara: "", hp: "", maps: "", jarak: ""
  });

  // Handlers
  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const loginAdmin = () => {
    if (loginData.username === "admin" && loginData.password === "12345") {
      localStorage.setItem("login", "true");
      setShowLogin(false);
      navigate("/pendaftar");
    } else {
      alert("Username atau password salah");
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    // Filter hanya angka untuk NIK dan KK
    if (name === "nik" || name === "kk" || name === "ayahNik" || name === "ibuNik") {
      value = value.replace(/\D/g, "").slice(0, 16);
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const ambilLokasi = () => {
    if (!navigator.geolocation) return alert("GPS tidak didukung oleh browser Anda");
    
    setSedangMenyimpan(true); // Re-use loading state for GPS
    navigator.geolocation.getCurrentPosition((pos) => {
      const latSekolah = -6.157834992333592, lngSekolah = 107.04103909701671;
      const R = 6371; // Radius bumi dalam KM
      const dLat = (pos.coords.latitude - latSekolah) * Math.PI / 180;
      const dLon = (pos.coords.longitude - lngSekolah) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(latSekolah*Math.PI/180) * Math.cos(pos.coords.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
      const jarak = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
      
      setForm(prev => ({ ...prev, maps: `${pos.coords.latitude},${pos.coords.longitude}`, jarak }));
      setSedangMenyimpan(false);
      alert("📍 Lokasi berhasil dikunci!");
    }, () => {
      alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
      setSedangMenyimpan(false);
    });
  };

  const simpanData = async () => {
    if (!form.nama || form.nik.length !== 16 || !form.jarak) {
      return alert("Mohon lengkapi Nama, NIK (16 digit), dan Lokasi GPS!");
    }
    
    if (!window.confirm("Apakah data yang Anda masukkan sudah benar?")) return;
    
    setSedangMenyimpan(true);
    try {
      const { error } = await supabase.from('pendaftar').insert([{ 
        ...form, 
        jarak_rumah: parseFloat(form.jarak),
        berat: parseInt(form.berat) || 0,
        tinggi: parseInt(form.tinggi) || 0,
        lingkar: parseInt(form.lingkar) || 0,
        saudara: parseInt(form.saudara) || 0
      }]);

      if (error) throw error;
      setSudahSimpan(true);
      alert("✅ Data Berhasil Tersimpan!");
    } catch (e) { 
      alert(e.code === '23505' ? "⚠️ NIK sudah terdaftar sebelumnya!" : "❌ Gagal: " + e.message); 
    } finally { 
      setSedangMenyimpan(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-white">
        
        {/* HEADER */}
        <header className="bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 text-white p-8 relative">
           <button 
             onClick={() => setShowLogin(true)} 
             className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2 rounded-2xl text-xs font-bold transition-all no-print"
           >
             👤 LOGIN ADMIN
           </button>
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-inner text-3xl">🏫</div>
             <div>
               <h1 className="text-xl md:text-3xl font-black tracking-tight">PPDB ONLINE 2026</h1>
               <p className="text-blue-100 text-sm font-medium opacity-90 uppercase">SDN KEDUNG PENGAWAS 04</p>
             </div>
           </div>
        </header>
        
        <div className="p-6 md:p-10 space-y-10">
           {/* SECTION I */}
           <section>
             <SectionTitle title="I. Identitas Peserta Didik" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputField label="Nama Lengkap" name="nama" value={form.nama} onChange={handleChange} placeholder="Sesuai Akta Kelahiran" />
                <InputField type="date" label="Tanggal Lahir" name="tanggalLahir" value={form.tanggalLahir} onChange={handleChange} />
                <InputField label="NIK (16 Digit)" name="nik" value={form.nik} onChange={handleChange} maxLength={16} placeholder="3216..." />
                <InputField label="Jarak Zonasi" value={form.jarak ? `${form.jarak} KM` : "Harap Klik GPS"} readOnly className="bg-blue-50/50 font-bold text-blue-700 border-blue-200" />
             </div>
           </section>

           {/* SECTION II */}
           <section>
             <SectionTitle title="II. Data Orang Tua" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputField label="Nama Ayah" name="ayahNama" value={form.ayahNama} onChange={handleChange} />
                <SelectField label="Pekerjaan Ayah" name="ayahPekerjaan" value={form.ayahPekerjaan} onChange={handleChange} options={pekerjaanList} />
                <InputField label="Nama Ibu" name="ibuNama" value={form.ibuNama} onChange={handleChange} />
                <SelectField label="Pekerjaan Ibu" name="ibuPekerjaan" value={form.ibuPekerjaan} onChange={handleChange} options={pekerjaanList} />
             </div>
           </section>
           
           {/* ACTIONS */}
           <div className="no-print pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4">
              <button 
                onClick={ambilLokasi} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                📍 KUNCI LOKASI GPS
              </button>
              
              <button 
                onClick={simpanData} 
                disabled={sedangMenyimpan} 
                className={`flex-1 px-8 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                  sedangMenyimpan ? 'bg-slate-300' : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-200'
                }`}
              >
                {sedangMenyimpan ? "⏳ SEDANG MEMPROSES..." : "💾 SIMPAN PENDAFTARAN"}
              </button>

              <button 
                onClick={() => sudahSimpan ? window.print() : alert("Harap simpan data terlebih dahulu!")} 
                className="bg-slate-800 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95"
              >
                🖨 CETAK PDF
              </button>
           </div>

           {sudahSimpan && (
             <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-700 text-sm font-medium text-center">
               ✨ Data telah berhasil disimpan ke sistem. Anda sekarang dapat mencetak formulir.
             </div>
           )}
        </div>
        
        <footer className="bg-slate-50 border-t p-6 text-center text-slate-400 text-xs font-medium">
          &copy; 2026 SDN KEDUNG PENGAWAS 04. All rights reserved.
        </footer>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl scale-in-center">
            <h2 className="text-xl font-black mb-2 text-center">Admin Access</h2>
            <p className="text-slate-500 text-sm text-center mb-6">Silakan masukkan kredensial Anda</p>
            
            <input 
              className="w-full border border-slate-200 p-3 mb-3 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100" 
              placeholder="Username" 
              name="username" 
              onChange={handleLoginChange} 
            />
            <input 
              className="w-full border border-slate-200 p-3 mb-6 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100" 
              type="password" 
              placeholder="Password" 
              name="password" 
              onChange={handleLoginChange} 
            />
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={loginAdmin} 
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-2xl font-bold transition-all"
              >
                LOG IN
              </button>
              <button 
                onClick={() => setShowLogin(false)} 
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-sm transition-all"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
