export interface MutasiDetail {
  tgl: string;
  plu: string;
  namaProduct: string;
  saldoAwal: number;
  receipt: number;
  return: number;
  sales: number;
  koreksi: number;
  saldo: number;
  selisi: number;
  stockOh: number;
  plusMinus: number;
  found: boolean;
  error?: string;
}

export interface StockItem {
  no: number;
  originalIndex?: number;
  plu: string;
  namaBarang: string;
  conv1: string;
  conv2: string;
  subdept: string;
  rack: string;
  stockFisik: number;
  stockOhToko: number;
  plusMinus: number;
  selisihRupiah: number;
  selisihRupiahRaw: string;
  hasMutasi?: boolean;
  mutasiDetail?: MutasiDetail;
}

export interface ReportData {
  report: string;
  storeId: string;
  storeName: string;
  storeSubname: string;
  tanggalSo: string;
  tanggalCetak: string;
  jenisSo: string;
  totalItemSo: number;
  totalItemSelisih: number;
  persentaseKetidaksesuaian: string;
  grandTotalSelisihRupiah: number;
  items: StockItem[];
  rawHtmlPreview?: string;
}

export interface QueryHistoryItem {
  id: string;
  storeId: string;
  dateSo: string;
  storeName: string;
  totalItems: number;
  totalSelisih: number;
  persenSelisih: string;
  timestamp: string;
}
