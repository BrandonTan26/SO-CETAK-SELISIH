import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const ALFA_HEADERS = {
  'Api-Key': 'iVOZX9MLmKrj1L8R23uF1aryMR1vGMXG',
  'x-api-key': 'iVOZX9MLmKrj1L8R23uF1aryMR1vGMXG',
  'App-Name': 'CEXP-CLOUD',
  'Platform': 'ANDROID',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
  Host: 'app.alfastore.co.id',
  Connection: 'Keep-Alive',
  'Accept-Encoding': 'gzip, deflate, br',
};

// In-memory cache for Mutasi per PLU to speed up responses
const mutasiCache = new Map<string, any>();

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchMutasiData(storeId: string, dateSo: string, plu: string, stockFisik: number = 0) {
  const cacheKey = `${storeId.trim().toUpperCase()}_${dateSo}_${plu.trim()}`;
  if (mutasiCache.has(cacheKey)) {
    return mutasiCache.get(cacheKey);
  }

  const url = `https://app.alfastore.co.id/prd/api/rpt/laporan/laporan_posisi_mutasi_per_plu?storeId=${encodeURIComponent(
    storeId.trim().toUpperCase()
  )}&periode1=${encodeURIComponent(dateSo)}&periode2=${encodeURIComponent(dateSo)}&plu=${encodeURIComponent(
    plu.trim()
  )}`;

  try {
    const res = await fetch(url, { headers: ALFA_HEADERS });
    if (!res.ok) {
      const fallback = {
        plu,
        stockOh: stockFisik,
        plusMinus: 0,
        found: false,
        error: `HTTP ${res.status}`,
      };
      return fallback;
    }

    const html = await res.text();
    const tbodyMatch = html.match(/<table class="datatable"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);

    if (!tbodyMatch) {
      const fallback = {
        plu,
        stockOh: stockFisik,
        plusMinus: 0,
        found: false,
      };
      mutasiCache.set(cacheKey, fallback);
      return fallback;
    }

    const trMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    for (const tr of trMatches) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cleanText(m[1]));
      // Expected columns: Tgl(0), PLU(1), Nama Product(2), Saldo Awal(3), Receipt(4), Return(5), Sales(6), Koreksi(7), Saldo(8), Selisi(9)
      if (tds.length >= 10 && tds[1] === plu.trim()) {
        const saldoAwal = parseFloat(tds[3].replace(/,/g, '')) || 0;
        const receipt = parseFloat(tds[4].replace(/,/g, '')) || 0;
        const returnQty = parseFloat(tds[5].replace(/,/g, '')) || 0;
        const sales = parseFloat(tds[6].replace(/,/g, '')) || 0;
        const koreksi = parseFloat(tds[7].replace(/,/g, '')) || 0;
        const saldo = parseFloat(tds[8].replace(/,/g, '')) || 0;
        const selisi = parseFloat(tds[9].replace(/,/g, '')) || 0;

        // Stock OH Toko: If koreksi exists, system stock before SO was saldo - koreksi (or Saldo Awal)
        const stockOh = koreksi !== 0 ? saldo - koreksi : saldo;
        const plusMinus = stockFisik - stockOh;

        const result = {
          plu,
          tgl: tds[0],
          namaProduct: tds[2],
          saldoAwal,
          receipt,
          return: returnQty,
          sales,
          koreksi,
          saldo,
          selisi,
          stockOh,
          plusMinus,
          found: true,
        };
        mutasiCache.set(cacheKey, result);
        return result;
      }
    }

    const notFoundResult = {
      plu,
      stockOh: stockFisik,
      plusMinus: 0,
      found: false,
    };
    mutasiCache.set(cacheKey, notFoundResult);
    return notFoundResult;
  } catch (err: any) {
    console.error(`Error fetching mutasi for PLU ${plu}:`, err.message);
    return {
      plu,
      stockOh: stockFisik,
      plusMinus: 0,
      found: false,
      error: err.message,
    };
  }
}

// Concurrency helper for batch fetching
async function runConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// API Route: Laporan Prosentase SO
app.get('/api/prosentase-so', async (req, res) => {
  try {
    const storeId = (req.query.storeId as string || '').trim().toUpperCase();
    const dateSo = (req.query.dateSo as string || '').trim();

    if (!storeId || !dateSo) {
      return res.status(400).json({ error: 'storeId dan dateSo wajib diisi' });
    }

    const url = `https://app.alfastore.co.id/prd/api/rpt/laporan_so/prosentase_so?storeId=${encodeURIComponent(
      storeId
    )}&dateSo=${encodeURIComponent(dateSo)}`;

    const response = await fetch(url, { headers: ALFA_HEADERS });
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Gagal mengambil data dari server Alfamart (Status ${response.status})`,
      });
    }

    const html = await response.text();

    // Check if report content is present
    const mReport = html.match(/Report<\/td>\s*<td[^>]*>:<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const mToko = html.match(/Toko<\/td>\s*<td[^>]*>:<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const mTokoSub = html.match(
      /<\/tr>\s*<tr>\s*<td>(?:&nbsp;|\s*)<\/td>\s*<td[^>]*>(?:&nbsp;|\s*)<\/td>\s*<td[^>]*>(.*?)<\/td>/i
    );
    const mTanggalSo = html.match(/Tanggal SO<\/td>\s*<td[^>]*>:<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const mTanggalCetak = html.match(/Tanggal Cetak<\/td>\s*<td[^>]*>:<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const mJenisSo = html.match(/Jenis SO<\/td>\s*<td[^>]*>:<\/td>\s*<td[^>]*>(.*?)<\/td>/i);

    const mTotalSo = html.match(/Total Item SO<\/td>\s*<td[^>]*>[:\s]*<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const mTotalSelisih = html.match(/Total Item Selisih<\/td>\s*<td[^>]*>[:\s]*<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const mPersen = html.match(
      /Persentasi Ketidaksesuaian SO<\/td>\s*<td[^>]*>[:\s]*<\/td>\s*<td[^>]*>(.*?)<\/td>/i
    );

    const storeName = mToko ? cleanText(mToko[1]) : '';
    const storeSubname = mTokoSub ? cleanText(mTokoSub[1]) : '';

    // Parse datatable rows
    const items: any[] = [];
    let grandTotalSelisihRupiah = 0;

    const tbodyMatch = html.match(/<table class="datatable"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
    if (tbodyMatch) {
      const trMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      for (const trMatch of trMatches) {
        const trContent = trMatch[1];
        if (trContent.includes('TOTAL') || trContent.includes('border-top: 1px solid black')) {
          const totalMatch = trContent.match(/<td[^>]*class="numeric_text"[^>]*>(.*?)<\/td>/gi);
          if (totalMatch && totalMatch.length >= 2) {
            const rawVal = cleanText(totalMatch[totalMatch.length - 1]);
            grandTotalSelisihRupiah = parseFloat(rawVal.replace(/,/g, '')) || 0;
          }
          continue;
        }

        const tds = [...trContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cleanText(m[1]));
        if (tds.length >= 8) {
          const rawSelisih = tds[7].replace(/,/g, '');
          const selisihRupiah = parseFloat(rawSelisih) || 0;
          const stockFisik = parseFloat(tds[6].replace(/,/g, '')) || 0;

          items.push({
            no: items.length + 1,
            originalIndex: items.length,
            plu: tds[0],
            namaBarang: tds[1],
            conv1: tds[2],
            conv2: tds[3],
            subdept: tds[4],
            rack: tds[5],
            stockFisik,
            stockOhToko: stockFisik, // Default, will be enriched with Mutasi
            plusMinus: 0,
            selisihRupiah,
            selisihRupiahRaw: tds[7],
            hasMutasi: false,
          });
        }
      }
    }

    // Identify items with selisih
    const itemsWithSelisih = items.filter((it) => it.selisihRupiah !== 0);

    // Automatically enrich items that have selisih with mutasi data!
    if (itemsWithSelisih.length > 0) {
      await runConcurrent(itemsWithSelisih, 8, async (item) => {
        const mutasi = await fetchMutasiData(storeId, dateSo, item.plu, item.stockFisik);
        if (mutasi && mutasi.found) {
          item.stockOhToko = mutasi.stockOh;
          item.plusMinus = mutasi.plusMinus;
          item.hasMutasi = true;
          item.mutasiDetail = mutasi;
        } else {
          // If mutasi API has no record for this item, calculate approximate plusMinus from selisihRupiah
          item.hasMutasi = false;
        }
      });
    }

    const totalItemSo = mTotalSo ? parseInt(cleanText(mTotalSo[1]), 10) || items.length : items.length;
    const totalItemSelisih = mTotalSelisih
      ? parseInt(cleanText(mTotalSelisih[1]), 10) || itemsWithSelisih.length
      : itemsWithSelisih.length;
    const persentaseKetidaksesuaian = mPersen
      ? cleanText(mPersen[1])
      : totalItemSo > 0
      ? `${((totalItemSelisih / totalItemSo) * 100).toFixed(2)} %`
      : '0.00 %';

    res.json({
      report: mReport ? cleanText(mReport[1]) : 'PROSENTASE STOCK OPNAME',
      storeId,
      storeName,
      storeSubname,
      tanggalSo: mTanggalSo ? cleanText(mTanggalSo[1]) : dateSo,
      tanggalCetak: mTanggalCetak ? cleanText(mTanggalCetak[1]) : '',
      jenisSo: mJenisSo ? cleanText(mJenisSo[1]) : 'SO REGULAR TOKO',
      totalItemSo,
      totalItemSelisih,
      persentaseKetidaksesuaian,
      grandTotalSelisihRupiah,
      items,
      rawHtmlPreview: html.slice(0, 1000),
    });
  } catch (err: any) {
    console.error('Error in /api/prosentase-so:', err);
    res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server' });
  }
});

// API Route: Mutasi per PLU
app.get('/api/mutasi-plu', async (req, res) => {
  try {
    const storeId = (req.query.storeId as string || '').trim().toUpperCase();
    const dateSo = (req.query.dateSo as string || '').trim();
    const plu = (req.query.plu as string || '').trim();
    const stockFisik = parseFloat(req.query.stockFisik as string || '0') || 0;

    if (!storeId || !dateSo || !plu) {
      return res.status(400).json({ error: 'storeId, dateSo, dan plu wajib diisi' });
    }

    const data = await fetchMutasiData(storeId, dateSo, plu, stockFisik);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan' });
  }
});

// API Route: Batch Mutasi PLU (to enrich non-selisih items if requested)
app.post('/api/batch-mutasi', async (req, res) => {
  try {
    const { storeId, dateSo, items } = req.body as {
      storeId: string;
      dateSo: string;
      items: { plu: string; stockFisik: number }[];
    };

    if (!storeId || !dateSo || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Format data tidak valid' });
    }

    const results = await runConcurrent(items, 10, async (item) => {
      const data = await fetchMutasiData(storeId, dateSo, item.plu, item.stockFisik);
      return { plu: item.plu, ...data };
    });

    const resultMap: Record<string, any> = {};
    for (const r of results) {
      resultMap[r.plu] = r;
    }

    res.json(resultMap);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan batch' });
  }
});

// Health check endpoint (for 24/7 Keep-Alive)
const startTime = Date.now();
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    time: new Date().toISOString(),
    wibTime: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    message: 'System live 24 jam non-stop',
  });
});

// Setup Vite or Static File Serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT} [LIVE 24 JAM]`);
});

// Configure keep-alive timeouts for persistent connection
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Automated 24/7 Keep-Alive self-ping to prevent sleep / cold-starts
const KEEP_ALIVE_INTERVAL = 2 * 60 * 1000; // Setiap 2 menit
setInterval(async () => {
  try {
    const urls = [`http://127.0.0.1:${PORT}/api/health`];
    if (process.env.APP_URL) {
      urls.push(`${process.env.APP_URL}/api/health`);
    }

    for (const u of urls) {
      await fetch(u).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}, KEEP_ALIVE_INTERVAL);
