import React, { useState } from 'react';
import { X, Lock, History, Store, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { QueryHistoryItem } from '../types';

interface Props {
  isOpen: boolean;
  historyList: QueryHistoryItem[];
  onClose: () => void;
  onSelectQuery: (storeId: string, dateSo: string) => void;
}

export const RiwayatPinModal: React.FC<Props> = ({
  isOpen,
  historyList,
  onClose,
  onSelectQuery,
}) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or any 4 digit
    if (pin === '1234' || pin.length >= 4) {
      setIsUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('PIN minimal 4 digit (Gunakan PIN default: 1234)');
    }
  };

  const handleReset = () => {
    setIsUnlocked(false);
    setPin('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Riwayat Cetak Selisih</h3>
              <p className="text-xs text-slate-400">Arsip pencarian & laporan sebelumnya</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="mt-5 space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Lock className="h-6 w-6" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">Masukkan PIN Keamanan</p>
              <p className="text-xs text-slate-400">
                Akses riwayat audit laporan toko (PIN Default: <span className="font-mono font-bold text-blue-600">1234</span>)
              </p>
            </div>

            <div>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="• • • •"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-slate-300 py-2.5 focus:border-blue-500 focus:outline-hidden"
                autoFocus
              />
              {errorMsg && <p className="mt-1 text-center text-xs text-red-500">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              Buka Riwayat
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Riwayat Tersimpan ({historyList.length})</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                Belum ada riwayat pengecekan sebelumnya.
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectQuery(item.storeId, item.dateSo);
                      handleReset();
                    }}
                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                          {item.storeId}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{item.storeName}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>SO: {item.dateSo}</span>
                        <span>•</span>
                        <span>Selisih: {item.totalSelisih} item ({item.persenSelisih})</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleReset}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
