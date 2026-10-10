import React, { useState } from 'react';
import { X, ShieldCheck, Key, Server, Cpu, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'settings'>('info');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Admin Portal & Status API</h3>
              <p className="text-xs text-slate-400">Konfigurasi Gateway Alfamart CEXP-CLOUD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 border border-emerald-100 text-xs">
            <div className="flex items-center gap-2 font-medium text-emerald-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Status Server API Alfamart
            </div>
            <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              TERHUBUNG
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-400">Endpoint Host:</span>
              <span className="font-mono font-medium">app.alfastore.co.id</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-400">App Name:</span>
              <span className="font-mono font-medium">CEXP-CLOUD</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-400">Platform Client:</span>
              <span className="font-mono font-medium">ANDROID (Mobile)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">API Key Header:</span>
              <span className="font-mono font-semibold text-blue-600">iVOZX9ML...MXG (Aktif)</span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900">
            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
              Sistem Otomatisasi
            </div>
            Setiap pencarian kode toko dan tanggal SO langsung memproses API Prosentase SO dan sinkronisasi OH Toko per PLU secara otomatis tanpa setup manual.
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
