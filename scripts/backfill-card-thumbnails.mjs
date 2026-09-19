// Run with a local app running: node scripts/backfill-card-thumbnails.mjs
// Optional: --dry-run, --base-url http://localhost:3000
const baseFlag = process.argv.indexOf("--base-url");
const base = new URL(baseFlag < 0 ? "http://localhost:3000" : process.argv[baseFlag + 1]);
const dryRun = process.argv.includes("--dry-run");
const ids = new Set();
let offset = 0;
while (true) {
  const response = await fetch(new URL(`/api/catalog/products?offset=${offset}&limit=48`, base), { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`catalog returned ${response.status}`);
  const payload = await response.json();
  if (!payload.ok || !Array.isArray(payload.data?.products)) throw new Error("invalid catalog response");
  for (const product of payload.data.products) ids.add(String(product.id));
  if (payload.data.nextOffset === null) break;
  if (payload.data.nextOffset <= offset) throw new Error("catalog pagination did not advance");
  offset = payload.data.nextOffset;
}
console.log(JSON.stringify({ products: ids.size, dryRun }));
if (!dryRun) {
  const list = [...ids];
  let completed = 0;
  const failures = [];
  // Two at a time keeps Sharp work and storage traffic bounded.
  for (let i = 0; i < list.length; i += 2) {
    await Promise.all(list.slice(i, i + 2).map(async id => {
      try {
        const response = await fetch(new URL(`/api/products/${encodeURIComponent(id)}/card-image`, base), { signal: AbortSignal.timeout(45000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.arrayBuffer();
        completed++;
      } catch (error) { failures.push({ id, error: String(error) }); }
    }));
    if ((i + 2) % 20 === 0) console.log(JSON.stringify({ completed, failed: failures.length, total: list.length }));
  }
  console.log(JSON.stringify({ completed, total: list.length, failures }));
  if (failures.length) process.exitCode = 1;
}
