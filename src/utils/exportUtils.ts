import * as XLSX from 'xlsx';
import { ReportData, StockItem } from '../types';

export function exportReportToExcel(reportData: ReportData, filteredItems: StockItem[]) {
  // Build header metadata rows
  const headerData = [
    ['LAPORAN PROSENTASE STOCK OPNAME - CETAK SELISIH'],
    ['Alfamart Store Portal Integration'],
    [],
    ['Report', ':', reportData.report, '', 'Tanggal SO', ':', reportData.tanggalSo],
    ['Toko', ':', `${reportData.storeName} [${reportData.storeId}]`, '', 'Tanggal Cetak', ':', reportData.tanggalCetak || new Date().toLocaleDateString('id-ID')],
    ['Sub Toko', ':', reportData.storeSubname || '-', '', 'Jenis SO', ':', reportData.jenisSo],
    [],
    [
      'No',
      'PLU',
      'Nama Barang',
      'Rack',
      'Stock Fisik',
      'Stock OH Toko',
      'Plus/Minus',
      'Selisih Rupiah',
      'Subdept',
      'Conv 1',
      'Conv 2',
    ],
  ];

  let totalSelisihRupiah = 0;
  const itemRows = filteredItems.map((item, index) => {
    totalSelisihRupiah += item.selisihRupiah;
    return [
      index + 1,
      item.plu,
      item.namaBarang,
      item.rack,
      item.stockFisik,
      item.stockOhToko,
      item.plusMinus,
      item.selisihRupiah,
      item.subdept,
      item.conv1,
      item.conv2,
    ];
  });

  const totalRow = [
    '',
    '',
    'TOTAL SELISIH RUPIAH',
    '',
    '',
    '',
    '',
    totalSelisihRupiah,
    '',
    '',
    '',
  ];

  const summaryRows = [
    [],
    ['Ringkasan Laporan:'],
    ['Total Item SO', ':', reportData.totalItemSo],
    ['Total Item Selisih', ':', reportData.totalItemSelisih],
    ['Persentase Ketidaksesuaian SO', ':', reportData.persentaseKetidaksesuaian],
  ];

  const allRows = [...headerData, ...itemRows, totalRow, ...summaryRows];

  const worksheet = XLSX.utils.aoa_to_sheet(allRows);

  // Auto-fit columns
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // PLU
    { wch: 40 }, // Nama Barang
    { wch: 8 },  // Rack
    { wch: 12 }, // Stock Fisik
    { wch: 14 }, // Stock OH Toko
    { wch: 12 }, // Plus/Minus
    { wch: 18 }, // Selisih Rupiah
    { wch: 10 }, // Subdept
    { wch: 8 },  // Conv 1
    { wch: 8 },  // Conv 2
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cetak Selisih SO');

  const filename = `Cetak_Selisih_${reportData.storeId}_${reportData.tanggalSo.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function printOrDownloadPdf() {
  window.print();
}
