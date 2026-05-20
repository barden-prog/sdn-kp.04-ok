import React, { useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [form, setForm] = useState({
    nama: "", tanggalLahir: "", nik: "", 
    ayahNama: "", ibuNama: "", jarak: ""
  });
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const ambilLokasi = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const latSekolah = -6.157834992333592, lngSekolah = 107.04103909701671;
      const R = 6371;
      const dLat = (pos.coords.latitude - latSekolah) * Math.PI / 180;
      const dLon = (pos.coords.longitude - lngSekolah) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(latSekolah*Math.PI/180) * Math.cos(pos.coords.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
      const jarak = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
      setForm(prev => ({ ...prev, jarak }));
      alert("Lokasi terkunci!");
    });
  };

  const simpanData = async () => {
    if (!form.nama || !form.jarak) return alert("Isi Nama & Ambil GPS!");
    setSedangMenyimpan(true);
    const { error } = await supabase.from('pendaftar').insert([{ ...form, jarak_rumah: parseFloat(form.jarak) }]);
    if (!error) alert("Berhasil Simpan!");
    setSedangMenyimpan(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <header className="bg-blue-800 text-white p-6">
          <h1 className="text-2xl font-bold">PPDB SDN KEDUNG PENGAWAS 04</h1>
        </header>

        <div className="p-6 space-y-6">
          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold">I. DATA SISWA</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="nama" placeholder="Nama Lengkap" className="border p-3 rounded-xl" onChange={handleChange} />
            <input name="nik" placeholder="NIK" className="border p-3 rounded-xl" onChange={handleChange} />
            <input name="jarak" placeholder="Jarak GPS" value={form.jarak} readOnly className="border p-3 rounded-xl bg-gray-100" />
          </div>

          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold">II. DATA ORANG TUA</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="ayahNama" placeholder="Nama Ayah" className="border p-3 rounded-xl" onChange={handleChange} />
            <input name="ibuNama" placeholder="Nama Ibu" className="border p-3 rounded-xl" onChange={handleChange} />
          </div>

          <div className="flex gap-4 pt-5">
            <button onClick={ambilLokasi} className="bg-emerald-600 text-white p-4 rounded-xl font-bold flex-1">📍 GPS</button>
            <button onClick={simpanData} className="bg-blue-700 text-white p-4 rounded-xl font-bold flex-1">💾 SIMPAN</button>
          </div>
        </div>
      </div>
    </div>
  );
}