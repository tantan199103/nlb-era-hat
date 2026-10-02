import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const TARGET_URL = process.env.TARGET_SUPABASE_URL || 'https://bnygkahseqvuiiurzwut.supabase.co';
const TARGET_KEY = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_QUEUE_FILE = '.tmp/1688-search-queue.json';
const DEFAULT_RESULT_FILE = '.tmp/1688-search-results.json';

function arg(name) {
  const value = process.argv.find((item) => item.startsWith(`${name}=`));
  return value ? value.slice(name.length + 1) : null;
}

function flag(name) {
  return process.argv.includes(name);
}

function requireKey() {
  if (!TARGET_KEY) throw new Error('Set TARGET_SUPABASE_SERVICE_ROLE_KEY before using the 1688 queue CLI.');
}

function client() {
  requireKey();
  return createClient(TARGET_URL, TARGET_KEY, { auth: { persistSession: false } });
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCandidate(candidate = {}) {
  const offerId = String(candidate.offerId || candidate.offer_id || '').trim() || null;
  const url = String(candidate.url || '').trim() || (offerId ? `https://detail.1688.com/offer/${offerId}.html` : null);
  return {
    rank: Math.max(1, Number(candidate.rank) || 1),
    offerId,
    url,
    title: String(candidate.title || '').trim() || null,
    imageUrl: String(candidate.imageUrl || candidate.image_url || '').trim() || null,
    score: numberOrNull(candidate.score),
    priceCny: numberOrNull(candidate.priceCny || candidate.price_cny),
  };
}

async function exportQueue() {
  const limit = Math.max(1, Math.min(500, Number(arg('--limit') || 25)));
  const output = arg('--output') || DEFAULT_QUEUE_FILE;
  const supabase = client();
  const { data, error } = await supabase
    .from('products')
    .select('id,title,thumbnail,images,source_1688_status,source_1688_checked_at')
    .eq('category', 'hats')
    .in('source_1688_status', ['PENDING', 'REVIEW'])
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Queue export failed: ${error.message}`);
  const rows = (data || []).map((product) => {
    const imageUrl = product.thumbnail || (Array.isArray(product.images) ? product.images[0] : '') || '';
    return {
      productId: product.id,
      title: product.title,
      imageUrl,
      imageSha256: sha256(imageUrl),
      source1688Status: product.source_1688_status,
      source1688CheckedAt: product.source_1688_checked_at,
    };
  }).filter((row) => row.imageUrl);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), targetUrl: TARGET_URL, count: rows.length, rows }, null, 2)}\n`);
  console.log(`Exported ${rows.length} 1688 image-search jobs to ${output}.`);
}

async function ingestResults() {
  const input = arg('--input') || DEFAULT_RESULT_FILE;
  if (!fs.existsSync(input)) throw new Error(`Result file not found: ${input}`);
  const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
  const rows = Array.isArray(payload) ? payload : payload.rows;
  if (!Array.isArray(rows) || !rows.length) throw new Error('Result file must contain a non-empty rows array.');
  const supabase = client();
  let saved = 0;
  for (const row of rows) {
    const productId = Number(row.productId || row.product_id);
    const imageUrl = String(row.imageUrl || row.image_url || '').trim();
    if (!Number.isFinite(productId) || !imageUrl) continue;
    const candidates = Array.isArray(row.candidates) ? row.candidates.map(normalizeCandidate) : [];
    const status = String(row.status || (row.blocked ? 'BLOCKED' : 'SEARCHED')).toUpperCase();
    const normalizedStatus = ['QUEUED', 'SEARCHED', 'BLOCKED', 'ERROR'].includes(status) ? status : 'SEARCHED';
    const { error } = await supabase.from('source_1688_search_runs').upsert({
      product_id: productId,
      provider: '1688_IMAGE_SEARCH',
      image_url: imageUrl,
      image_sha256: String(row.imageSha256 || row.image_sha256 || sha256(imageUrl)),
      status: normalizedStatus,
      candidates,
      error_message: row.errorMessage || row.error_message || null,
      started_at: row.startedAt || row.started_at || null,
      completed_at: row.completedAt || row.completed_at || new Date().toISOString(),
    }, { onConflict: 'product_id,provider,image_sha256' });
    if (error) throw new Error(`Search run ${productId} failed: ${error.message}`);
    saved += 1;
    // Evidence is deliberately kept in REVIEW. This command never promotes
    // a product to MATCHED; an admin must compare logo, colour and silhouette.
    if (normalizedStatus === 'SEARCHED' && candidates.length && flag('--mark-review')) {
      const best = candidates[0];
      const { error: productError } = await supabase.from('products').update({
        source_1688_status: 'REVIEW',
        source_1688_url: best.url,
        source_1688_title: best.title,
        source_1688_image_url: best.imageUrl,
        source_1688_score: best.score,
        source_1688_checked_at: row.completedAt || row.completed_at || new Date().toISOString(),
        source_1688_note: 'Top candidate recorded from 1688 image search; admin comparison required before MATCHED.',
        is_active: false,
      }).eq('id', productId);
      if (productError) throw new Error(`Product ${productId} review update failed: ${productError.message}`);
    }
  }
  console.log(`Ingested ${saved} 1688 search runs. Products remain hidden until an admin confirms MATCHED.`);
}

async function main() {
  if (flag('--export')) return exportQueue();
  if (flag('--ingest')) return ingestResults();
  console.log('Usage: node scripts/1688_search_queue.mjs --export [--limit=25] [--output=.tmp/1688-search-queue.json]');
  console.log('   or: node scripts/1688_search_queue.mjs --ingest [--input=.tmp/1688-search-results.json] [--mark-review]');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
