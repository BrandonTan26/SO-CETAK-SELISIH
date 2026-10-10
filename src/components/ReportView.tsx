import React, { useState, useMemo } from 'react';
import { ReportData, StockItem } from '../types';
import {
  FileSpreadsheet,
  FileText,
  CheckCircle,
  ArrowUpDown,
  Filter,
  Search,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { exportReportToExcel, printOrDownloadPdf } from '../utils/exportUtils';

interface Props {
  data: ReportData;
  onSelectItemForDetail: (item: StockItem) => void;
}

type SortMode = 'rack' | 'selisih-desc' | 'selisih-asc';

export const ReportView: React.FC<Props> = ({ data, onSelectItemForDetail }) => {
  const [sortMode, setSortMode] = useState<SortMode>('rack');
  const [selectedRack, setSelectedRack] = useState<string>('all');
  const [hideZeroSelisih, setHideZeroSelisih] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all distinct racks
  const availableRacks = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((item) => {
      if (item.rack && item.rack.trim()) {
        set.add(item.rack.trim());
      }
    });
    return Array.from(set).sort();
  }, [data.items]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = [...data.items];

    // Filter by zero selisih toggle
    if (hideZeroSelisih) {
      result = result.filter((item) => item.selisihRupiah !== 0 || item.plusMinus !== 0);
    }

    // Filter by selected rack
    if (selectedRack !== 'all') {
      result = result.filter((item) => item.rack.trim() === selectedRack);
    }

    // Filter by search query (PLU or Nama)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) => item.plu.toLowerCase().includes(q) || item.namaBarang.toLowerCase().includes(q)
      );
    }

    // Sort items
    result.sort((a, b) => {
      if (sortMode === 'rack') {
        // Pertahankan urutan persis sama dengan PDA Toko / Server Toko Edit SO
        const idxA = a.originalIndex !== undefined ? a.originalIndex : a.no;
        const idxB = b.originalIndex !== undefined ? b.originalIndex : b.no;
        return idxA - idxB;
      } else if (sortMode === 'selisih-desc') {
        // Selisih Tertinggi (absolute difference or largest rupiah)
        return Math.abs(b.selisihRupiah) - Math.abs(a.selisihRupiah);
      } else if (sortMode === 'selisih-asc') {
        // Minus ke Plus (most negative to positive)
        return a.selisihRupiah - b.selisihRupiah;
      }
      return 0;
    });

    return result;
  }, [data.items, hideZeroSelisih, selectedRack, searchQuery, sortMode]);

  // Compute subtotal selisih rupiah of displayed rows
  const subtotalSelisihRupiah = useMemo(() => {
    return processedItems.reduce((acc, curr) => acc + curr.selisihRupiah, 0);
  }, [processedItems]);

  const handleExportExcel = () => {
    exportReportToExcel(data, processedItems);
  };

  const handleExportPdf = () => {
    printOrDownloadPdf();
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        {/* Top bar with Title, Badge, and Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Hasil Laporan
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Posisi Mutasi (OH Toko) Terhubung</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-lg bg-[#107c41] hover:bg-[#0c6334] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Unduh Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d83b01] hover:bg-[#b03001] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="mt-5 grid grid-cols-1 gap-y-3 gap-x-8 text-xs sm:grid-cols-2">
          {/* Left Metadata Column */}
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-20 font-medium text-slate-500">Report</span>
              <span className="mr-2 text-slate-400">:</span>
              <span className="font-bold text-[#1a56db]">{data.report}</span>
            </div>
            <div className="flex items-start">
              <span className="w-20 font-medium text-slate-500">Toko</span>
              <span className="mr-2 text-slate-400">:</span>
              <div>
                <span className="font-bold text-slate-800">{data.storeName || data.storeId}</span>
                {data.storeSubname && (
                  <div className="text-slate-600 font-medium">{data.storeSubname}</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Metadata Column */}
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-24 font-medium text-slate-500">Tanggal SO</span>
              <span className="mr-2 text-slate-400">:</span>
              <span className="font-semibold text-slate-800">{data.tanggalSo}</span>
            </div>
            <div className="flex">
              <span className="w-24 font-medium text-slate-500">Tanggal Cetak</span>
              <span className="mr-2 text-slate-400">:</span>
              <span className="font-semibold text-slate-800">
                {data.tanggalCetak || new Date().toLocaleDateString('id-ID')}
              </span>
            </div>
            <div className="flex">
              <span className="w-24 font-medium text-slate-500">Jenis SO</span>
              <span className="mr-2 text-slate-400">:</span>
              <span className="font-semibold text-slate-800">{data.jenisSo}</span>
            </div>
          </div>
        </div>

        {/* Sorting and Filters Toolbar */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          {/* Sorting Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 mr-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span>Urutkan:</span>
            </span>

            <button
              type="button"
              onClick={() => setSortMode('rack')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                sortMode === 'rack'
                  ? 'bg-[#1a56db] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rack (A-Z)
            </button>

            <button
              type="button"
              onClick={() => setSortMode('selisih-desc')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                sortMode === 'selisih-desc'
                  ? 'bg-[#1a56db] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Selisih (Tertinggi)
            </button>

            <button
              type="button"
              onClick={() => setSortMode('selisih-asc')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                sortMode === 'selisih-asc'
                  ? 'bg-[#1a56db] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Selisih (Minus ke Plus)
            </button>
          </div>

          {/* Rack Filter and Zero Toggle */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Rack Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Filter Rack:</span>
              <div className="relative">
                <select
                  value={selectedRack}
                  onChange={(e) => setSelectedRack(e.target.value)}
                  className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Rack</option>
                  {availableRacks.map((rack) => (
                    <option key={rack} value={rack}>
                      Rack {rack}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Sembunyikan Selisih 0 Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideZeroSelisih}
                  onChange={(e) => setHideZeroSelisih(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1a56db]"></div>
              </div>
              <span>Sembunyikan Selisih 0</span>
            </label>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="mt-4 flex items-center justify-between gap-3 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari PLU atau Nama Barang..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="text-[11px] text-slate-500 font-medium pr-2">
            Menampilkan <span className="font-bold text-slate-800">{processedItems.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{data.items.length}</span> item
          </div>
        </div>

        {/* Datatable */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12 border-r border-slate-200">No</th>
                <th className="py-3 px-3 text-center w-24 border-r border-slate-200">PLU</th>
                <th className="py-3 px-4 border-r border-slate-200">Nama Barang</th>
                <th className="py-3 px-3 text-center w-16 border-r border-slate-200">Rack</th>
                <th className="py-3 px-3 text-center w-24 border-r border-slate-200">Stock Fisik</th>
                <th className="py-3 px-3 text-center w-28 border-r border-slate-200">
                  Stock OH Toko
                </th>
                <th className="py-3 px-3 text-center w-24 border-r border-slate-200">Plus/Minus</th>
                <th className="py-3 px-4 text-right w-36">Selisih Rupiah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {processedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada data item yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                processedItems.map((item, idx) => (
                  <tr
                    key={item.plu + idx}
                    onClick={() => onSelectItemForDetail(item)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-100">
                      {item.plu}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>{item.namaBarang}</span>
                        <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-100">
                      {item.rack || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 border-r border-slate-100">
                      {item.stockFisik}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-800 border-r border-slate-100">
                      <span className="inline-flex items-center gap-1">
                        {item.stockOhToko}
                        {item.hasMutasi && (
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                            title="Posisi mutasi server tersinkronisasi"
                          ></span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.plusMinus < 0
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : item.plusMinus > 0
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {item.plusMinus > 0 ? `+${item.plusMinus}` : item.plusMinus}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-bold ${
                        item.selisihRupiah < 0
                          ? 'text-red-600'
                          : item.selisihRupiah > 0
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.selisihRupiahRaw ||
                        item.selisihRupiah.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}

              {/* Subtotal Total Selisih Rupiah Row */}
              <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-300">
                <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-slate-800">
                  TOTAL SELISIH RUPIAH
                </td>
                <td
                  className={`py-3 px-4 text-right text-sm ${
                    subtotalSelisihRupiah < 0
                      ? 'text-red-600'
                      : subtotalSelisihRupiah > 0
                      ? 'text-emerald-600'
                      : 'text-slate-800'
                  }`}
                >
                  {subtotalSelisihRupiah.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Cards */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-t border-slate-100 pt-6">
          {/* Left Summary Info */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-6">
              <span className="w-48 font-medium text-slate-600">Total Item SO</span>
              <span className="text-sm font-bold text-slate-900">{data.totalItemSo}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-48 font-medium text-slate-600">Total Item Selisih</span>
              <span className="text-sm font-bold text-slate-900">{data.totalItemSelisih}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-48 font-medium text-slate-600">
                Persentasi Ketidaksesuaian SO
              </span>
              <span className="text-base font-bold text-[#1a56db]">
                {data.persentaseKetidaksesuaian}
              </span>
            </div>
          </div>

          {/* Right Action Buttons Duplicate */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-lg bg-[#107c41] hover:bg-[#0c6334] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Unduh Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d83b01] hover:bg-[#b03001] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
