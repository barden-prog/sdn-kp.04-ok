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

  const [form, setForm] = React.useState({
    sekolah: "SDN KEDUNG PENGAWAS 04",
    tahunPelajaran: "2026/2027",
    nama: "", jk: "Laki-laki", nisn: "", tempatLahir: "", tanggalLahir: "",
    nik: "", kk: "", akta: "", agama: "Islam", kip: "Tidak", alamat: "",
    desa: "", kecamatan: "", kabupaten: "", provinsi: "", kodePos: "",
    anakKe: "", tinggal: "Orang Tua", transportasi: "Jalan Kaki", hp: "", maps: "",
    ayahNama: "", ayahNik: "", ayahTahun: "", ayahPendidikan: "", ayahPekerjaan: "", ayahPenghasilan: "",
    ibuNama: "", ibuNik: "", ibuTahun: "", ibuPendidikan: "", ibuPekerjaan: "", ibuPenghasilan: "",
    berat: 0, tinggi: 0, lingkar: 0, saudara: 0, hobi: "", cita: "", jarak: "", waktu: "",
    kotaTtd: "Babelan", tanggalTtd: ""
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const hitungUsia = React.useCallback(() => {
    if (!form.tanggalLahir) return { tahun: 0, bulan: 0, status: "" };
    const lahir = new Date(form.tanggalLahir);
    const batas = new Date("2026-07-01");
    let tahun = batas.getFullYear() - lahir.getFullYear();
    let bulan = batas.getMonth() - lahir.getMonth();
    if (bulan < 0) { tahun--; bulan += 12; }
    let status = (tahun >= 7) ? "Prioritas (Usia 7 Tahun)" : (tahun >= 6) ? "Memenuhi Syarat" : (tahun === 5 && bulan >= 6) ? "Perlu surat psikolog" : "Tidak Memenuhi Syarat";
    return { tahun, bulan, status };
  }, [form.tanggalLahir]);

  const usiaSiswa = hitungUsia();

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "nik" || name === "kk") {
      value = value.replace(/\D/g, "").slice(0, 16);
    }
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
    }, () => alert("Gagal ambil lokasi"));
  };

  const simpanData = async () => {
    if (!form.nama || form.nik.length !== 16 || !form.jarak) return alert("Lengkapi data & GPS!");
    setSedangMenyimpan(true);
    try {
      const { error } = await supabase.from('pendaftar').insert([{ ...form, jarak_rumah: parseFloat(form.jarak) }]);
      if (error) throw error;
      setSudahSimpan(true);
      alert("✅ Tersimpan!");
    } catch (e) { alert("Gagal: " + e.message); }
    finally { setSedangMenyimpan(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <header className="bg-blue-800 text-white p-6">
          <h1 className="text-2xl font-black">PPDB SDN KEDUNG PENGAWAS 04</h1>
          <button onClick={() => setShowLogin(true)} className="mt-2 text-sm underline no-print">Admin Login</button>
        </header>

        <div className="p-6 space-y-6">
          <SectionTitle title="IDENTITAS SISWA" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Lengkap" name="nama" value={form.nama} onChange={handleChange} />
            <Input type="date" label="Tgl Lahir" name="tanggalLahir" value={form.tanggalLahir} onChange={handleChange} />
            <Input label="NIK (16 Digit)" name="nik" value={form.nik} onChange={handleChange} maxLength={16} />
            <Input label="Alamat" name="alamat" value={form.alamat} onChange={handleChange} />
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 no-print">
            <p className="text-sm font-bold mb-2">Lokasi: {form.jarak ? `${form.jarak} KM` : "Belum diambil"}</p>
            <button onClick={ambilLokasi} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold">📍 Ambil Lokasi GPS</button>
          </div>

          <div className="flex gap-4 pt-6 no-print">
            <button onClick={() => window.print()} className="bg-blue-700 text-white px-6 py-3 rounded-xl font-bold">🖨 Cetak PDF</button>
            <button onClick={simpanData} disabled={sedangMenyimpan} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">
              {sedangMenyimpan ? "Menyimpan..." : "💾 Simpan Data"}
            </button>
          </div>
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-80">
            <h2 className="font-bold mb-4">Admin Login</h2>
            <input className="w-full border p-2 mb-2 rounded" placeholder="Username" name="username" onChange={handleLoginChange} />
            <input className="w-full border p-2 mb-4 rounded" type="password" placeholder="Password" name="password" onChange={handleLoginChange} />
            <button onClick={() => loginData.password === "12345" ? window.location.href="/pendaftar" : alert("Salah!")} className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
            <button onClick={() => setShowLogin(false)} className="w-full mt-2">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}

const SectionTitle = ({ title }) => (
  <div className="bg-slate-700 text-white px-4 py-2 rounded-xl font-bold text-sm">{title}</div>
);

const Input = ({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold text-slate-600 mb-1">{label}</label>
    <input {...props} className="border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
  </div>
);