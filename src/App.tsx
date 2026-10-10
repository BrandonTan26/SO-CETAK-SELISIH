import React, { useState, useEffect } from 'react';
import { ReportFilterForm } from './components/ReportFilterForm';
import { ReportView } from './components/ReportView';
import { MutasiDetailModal } from './components/MutasiDetailModal';
import { RiwayatPinModal } from './components/RiwayatPinModal';
import { ReportData, StockItem, QueryHistoryItem } from './types';
import { Search, AlertCircle, RefreshCw, Database } from 'lucide-react';

export default function App() {
  // Tanggal otomatis mengikuti hari ini (WIB - Waktu Indonesia Barat)
  const getTodayFormatted = () => {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Jakarta' }); // Format: DD/MM/YYYY
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    } catch {
      // Fallback ke tanggal lokal perangkat
    }
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [storeId, setStoreId] = useState<string>('');
  const [dateSo, setDateSo] = useState<string>(getTodayFormatted());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<StockItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // 24 JAM KEEP-ALIVE HEARTBEAT (Mencegah web & server tertidur / sleep)
  useEffect(() => {
    const keepAlivePing = async () => {
      try {
        await fetch('/api/health');
      } catch (e) {
        // Abaikan error jaringan sementara
      }
    };

    // Ping pertama kali
    keepAlivePing();

    // Ping setiap 2 menit secara terus-menerus
    const intervalId = setInterval(keepAlivePing, 2 * 60 * 1000);

    // Ping saat tab dibuka kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        keepAlivePing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Query history
  const [historyList, setHistoryList] = useState<QueryHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('alfa_so_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToHistory = (data: ReportData) => {
    const newItem: QueryHistoryItem = {
      id: `${data.storeId}_${data.tanggalSo}_${Date.now()}`,
      storeId: data.storeId,
      dateSo: data.tanggalSo,
      storeName: data.storeName || data.storeId,
      totalItems: data.totalItemSo,
      totalSelisih: data.totalItemSelisih,
      persenSelisih: data.persentaseKetidaksesuaian,
      timestamp: new Date().toISOString(),
    };

    setHistoryList((prev) => {
      const filtered = prev.filter(
        (h) => !(h.storeId === data.storeId && h.dateSo === data.tanggalSo)
      );
      const updated = [newItem, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('alfa_so_history', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const fetchReport = async (overrideStore?: string, overrideDate?: string) => {
    const sId = (overrideStore || storeId).trim().toUpperCase();
    const dSo = (overrideDate || dateSo).trim();

    if (!sId) {
      setErrorMessage('Silakan masukkan Kode Toko.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/prosentase-so?storeId=${encodeURIComponent(sId)}&dateSo=${encodeURIComponent(dSo)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Gagal menghubungi server Alfamart (${response.status})`
        );
      }

      const data: ReportData = await response.json();
      setReportData(data);
      saveToHistory(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMessage(
        err.message || 'Terjadi kesalahan saat memproses data laporan dari server Alfamart.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQueryFromHistory = (selectedStore: string, selectedDate: string) => {
    setStoreId(selectedStore);
    setDateSo(selectedDate);
    fetchReport(selectedStore, selectedDate);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 antialiased font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filter Card */}
        <ReportFilterForm
          storeId={storeId}
          setStoreId={setStoreId}
          dateSo={dateSo}
          setDateSo={setDateSo}
          isLoading={isLoading}
          onFetchReport={() => fetchReport()}
          onOpenPinModal={() => setIsPinModalOpen(true)}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Gagal Mengambil Data</h4>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
              <div className="mt-2">
                <button
                  onClick={() => fetchReport()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 animate-pulse">
              <Database className="h-7 w-7 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Memproses Permintaan ke Server Alfamart...
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Menghubungkan ke <span className="font-semibold">app.alfastore.co.id</span> untuk menarik
                data Prosentase SO toko <span className="font-bold text-blue-600">{storeId}</span> dan
                sinkronisasi posisi mutasi OH per PLU.
              </p>
            </div>
          </div>
        )}

        {/* Empty State when no report has been searched yet */}
        {!reportData && !isLoading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-16 px-6 text-center shadow-2xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#1a56db]">
              <Search className="h-8 w-8 stroke-[2.2]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">
              Silakan Masukkan Kode Toko
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Ketikkan Kode Toko dan tentukan Tanggal SO pada kolom di atas, lalu tekan tombol{' '}
              <span className="font-semibold text-[#1a56db]">"Tampilkan Laporan"</span> untuk melihat
              data laporan.
            </p>
          </div>
        )}

        {/* Report Output View */}
        {reportData && !isLoading && (
          <ReportView
            data={reportData}
            onSelectItemForDetail={(item) => setSelectedItemForDetail(item)}
          />
        )}
      </div>

      {/* Modals */}
      <MutasiDetailModal
        item={selectedItemForDetail}
        storeId={reportData?.storeId || storeId}
        dateSo={reportData?.tanggalSo || dateSo}
        onClose={() => setSelectedItemForDetail(null)}
      />

      <RiwayatPinModal
        isOpen={isPinModalOpen}
        historyList={historyList}
        onClose={() => setIsPinModalOpen(false)}
        onSelectQuery={handleSelectQueryFromHistory}
      />
    </div>
  );
}
