import React from 'react';
import { StockItem } from '../types';
import { X, ArrowRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface Props {
  item: StockItem | null;
  storeId: string;
  dateSo: string;
  onClose: () => void;
}

export const MutasiDetailModal: React.FC<Props> = ({ item, storeId, dateSo, onClose }) => {
  if (!item) return null;

  const m = item.mutasiDetail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Detail Posisi Mutasi PLU</h3>
              <p className="text-xs text-slate-500">
                Toko: <span className="font-semibold text-slate-700">{storeId}</span> | Periode:{' '}
                <span className="font-semibold text-slate-700">{dateSo}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 inline-block px-2 py-0.5 rounded">
                PLU: {item.plu}
              </div>
              <h4 className="mt-1 text-sm font-bold text-slate-900">{item.namaBarang}</h4>
              <p className="text-xs text-slate-500">
                Rack: <span className="font-medium text-slate-700">{item.rack}</span> | Subdept:{' '}
                <span className="font-medium text-slate-700">{item.subdept}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Selisih SO</span>
              <div
                className={`text-sm font-bold ${
                  item.selisihRupiah < 0
                    ? 'text-red-600'
                    : item.selisihRupiah > 0
                    ? 'text-emerald-600'
                    : 'text-slate-700'
                }`}
              >
                Rp {item.selisihRupiah.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {m && m.found ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Data Mutasi Server Alfamart (Live)
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <span className="block text-[11px] font-medium text-slate-400">Saldo Awal</span>
                <span className="text-base font-bold text-slate-800">{m.saldoAwal}</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <span className="block text-[11px] font-medium text-slate-400">Receipt (+)</span>
                <span className="text-base font-bold text-emerald-600">+{m.receipt}</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <span className="block text-[11px] font-medium text-slate-400">Return (-)</span>
                <span className="text-base font-bold text-amber-600">-{m.return}</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <span className="block text-[11px] font-medium text-slate-400">Sales (-)</span>
                <span className="text-base font-bold text-red-500">-{m.sales}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
                <span className="block text-[11px] font-medium text-blue-700">Stock OH Toko</span>
                <span className="text-lg font-bold text-blue-900">{item.stockOhToko}</span>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-center">
                <span className="block text-[11px] font-medium text-purple-700">Stock Fisik</span>
                <span className="text-lg font-bold text-purple-900">{item.stockFisik}</span>
              </div>
              <div
                className={`rounded-xl border p-3 text-center ${
                  item.plusMinus < 0
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : item.plusMinus > 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-[11px] font-medium">Plus / Minus</span>
                <span className="text-lg font-bold">
                  {item.plusMinus > 0 ? `+${item.plusMinus}` : item.plusMinus}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Koreksi Mutasi (SO):</span>
                <span className="font-mono font-bold">{m.koreksi}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo Akhir Toko:</span>
                <span className="font-mono font-bold">{m.saldo}</span>
              </div>
              <div className="flex justify-between">
                <span>Selisi Record:</span>
                <span className="font-mono font-bold">{m.selisi}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Tidak ada catatan mutasi fisik tersendiri di server untuk tanggal ini.
            </div>
            <p className="mt-1 text-slate-600">
              Stock OH Toko diperkirakan sama dengan stock tercatat SO.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-900"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
