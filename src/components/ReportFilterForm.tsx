import React from 'react';
import { Search, Calendar, Lock, Loader2, Radio } from 'lucide-react';

interface Props {
  storeId: string;
  setStoreId: (val: string) => void;
  dateSo: string;
  setDateSo: (val: string) => void;
  isLoading: boolean;
  onFetchReport: () => void;
  onOpenPinModal: () => void;
}

export const ReportFilterForm: React.FC<Props> = ({
  storeId,
  setStoreId,
  dateSo,
  setDateSo,
  isLoading,
  onFetchReport,
  onOpenPinModal,
}) => {
  // Convert standard HTML date YYYY-MM-DD to DD-MM-YYYY and vice versa
  const toInputDate = (dStr: string) => {
    // If DD-MM-YYYY -> YYYY-MM-DD
    const parts = dStr.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  const fromInputDate = (dStr: string) => {
    // If YYYY-MM-DD -> DD-MM-YYYY
    const parts = dStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId.trim()) return;
    onFetchReport();
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a56db]">
          Laporan Prosentase Stock Opname
        </h1>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sistem Live 24 Jam</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
          {/* Input Kode Toko */}
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Masukan kode toko
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value.toUpperCase())}
              placeholder="MASUKKAN KODE TOKO"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold tracking-wider text-slate-800 placeholder:text-slate-400 focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/20 focus:outline-hidden uppercase"
              required
            />
          </div>

          {/* Input Tanggal SO */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tanggal SO
            </label>
            <div className="relative">
              <input
                type="date"
                value={toInputDate(dateSo)}
                onChange={(e) => setDateSo(fromInputDate(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pl-10 text-sm font-semibold text-slate-800 focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/20 focus:outline-hidden"
                required
              />
              <Calendar className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Tombol Tampilkan Laporan */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isLoading || !storeId.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a56db] hover:bg-[#1648bd] active:bg-[#133fa8] disabled:bg-blue-300 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Tampilkan Laporan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="mt-4 flex items-center justify-start pt-2">
          <button
            type="button"
            onClick={onOpenPinModal}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Buka Riwayat (PIN)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
