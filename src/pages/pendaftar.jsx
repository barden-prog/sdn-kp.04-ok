import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import kop from "./assets/kop.png";

export default function Pendaftar() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Check login status
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("login");
    if (!isLoggedIn) {
      navigate("/sdn-kp.04-ok/");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: pendaftar, error } = await supabase
        .from("pendaftar")
        .select("*")
        .order("jarak", { ascending: true });

      if (error) throw error;
      setData(pendaftar || []);
    } catch (err) {
      console.error("Error fetching data:", err.message);
      setError("Gagal mengambil data dari database");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      const img = new Image();
      img.src = kop;

      img.onload = () => {
        doc.addImage(img, "PNG", 10, 5, 190, 35);
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(14).setFont("helvetica", "bold");
        doc.text("DATA PENDAFTAR PPDB", pageWidth / 2, 48, { align: "center" });
        
        doc.setFontSize(11).setFont("helvetica", "normal");
        doc.text("SDN Kedung Pengawas 04", pageWidth / 2, 54, { align: "center" });

        autoTable(doc, {
          startY: 62,
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
          head: [["Rank", "Nama", "NIK", "HP", "Alamat", "Jarak (KM)"]],
          body: data.map((item, i) => [
            i + 1,
            item.nama || "-",
            item.nik || "-",
            item.hp || "-",
            `${item.desa || ""} ${item.kecamatan || ""}`.trim() || "-",
            parseFloat(item.jarak || 0).toFixed(2),
          ]),
          margin: { top: 10 },
        });

        doc.save(`PPDB_SDNKP04_${new Date().toLocaleDateString()}.pdf`);
        setExporting(false);
      };
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Gagal export PDF");
      setExporting(false);
    }
  };

  /* ================= EXCEL EXPORT ================= */
  const exportExcel = async () => {
    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Data Pendaftar");

      // Header Styling
      sheet.mergeCells("A1:H1");
      const title = sheet.getCell("A1");
      title.value = "REKAPITULASI PENDAFTAR PPDB SDN KEDUNG PENGAWAS 04";
      title.font = { bold: true, size: 14 };
      title.alignment = { horizontal: "center" };

      const header = ["Rank", "Nama", "NIK", "NISN", "HP", "Alamat", "Jarak (KM)", "Tanggal Daftar"];
      const headerRow = sheet.addRow(header);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2563EB" } };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      // Add Data Rows with formatting
      data.forEach((item, i) => {
        const row = sheet.addRow([
          i + 1,
          item.nama,
          item.nik,
          item.nisn || "-",
          item.hp,
          `${item.alamat || ""}, ${item.desa || ""}`.trim(),
          parseFloat(item.jarak || 0).toFixed(2),
          item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-",
        ]);

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        });
      });

      // Auto width columns
      sheet.columns.forEach(col => {
        col.width = 18;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Data_Pendaftar_PPDB_${new Date().toLocaleDateString()}.xlsx`);
      setExporting(false);
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Gagal export Excel");
      setExporting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("login");
    navigate("/sdn-kp.04-ok/");
  };

  const refreshData = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-600">Sinkronisasi Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl text-white text-2xl">📚</div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">Panel Admin PPDB</h1>
                <p className="text-slate-500 text-sm">SDN Kedung Pengawas 04</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                onClick={refreshData} 
                disabled={loading}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-all font-bold disabled:opacity-50"
              >
                <span>🔄</span> Refresh
              </button>
              <button 
                onClick={exportExcel}
                disabled={exporting || data.length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                <span>📊</span> Excel
              </button>
              <button 
                onClick={exportPDF}
                disabled={exporting || data.length === 0}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-100 disabled:opacity-50"
              >
                <span>📄</span> PDF
              </button>
              <button 
                onClick={logout}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-all font-bold"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 text-red-700">
            <p className="font-bold">⚠️ {error}</p>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
            <p className="opacity-80 text-sm">Total Pendaftar</p>
            <h3 className="text-4xl font-black">{data.length}</h3>
            <p className="text-sm opacity-80 mt-1">Siswa</p>
          </div>
          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-100">
            <p className="opacity-80 text-sm">Jarak Terdekat</p>
            <h3 className="text-4xl font-black">{data.length > 0 ? parseFloat(data[0].jarak).toFixed(2) : "0"}</h3>
            <p className="text-sm opacity-80 mt-1">KM</p>
          </div>
          <div className="bg-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-purple-100">
            <p className="opacity-80 text-sm">Jarak Terjauh</p>
            <h3 className="text-4xl font-black">{data.length > 0 ? parseFloat(data[data.length - 1].jarak).toFixed(2) : "0"}</h3>
            <p className="text-sm opacity-80 mt-1">KM</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-4 font-black text-slate-600 w-16">Rank</th>
                  <th className="p-4 font-black text-slate-600">Nama Lengkap</th>
                  <th className="p-4 font-black text-slate-600">NIK</th>
                  <th className="p-4 font-black text-slate-600 hidden md:table-cell">Kontak</th>
                  <th className="p-4 font-black text-slate-600 hidden lg:table-cell">Wilayah</th>
                  <th className="p-4 font-black text-slate-600 text-right">Jarak</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, i) => (
                    <tr key={item.id || i} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                      <td className="p-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${i === 0 ? "bg-yellow-100 text-yellow-700" : 
                              i === 1 ? "bg-slate-300 text-slate-700" : 
                              i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {i + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 uppercase">{item.nama}</p>
                        <p className="text-xs text-slate-500">{item.jk === "Laki-laki" ? "👨" : "👩"} {item.jk}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-mono text-slate-600">{item.nik}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600 hidden md:table-cell">
                        {item.hp || "-"}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <p className="text-sm text-slate-700">{item.desa}</p>
                        <p className="text-xs text-slate-400">{item.kecamatan}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                          {parseFloat(item.jarak || 0).toFixed(2)} KM
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 italic">
                      Belum ada pendaftar yang masuk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
