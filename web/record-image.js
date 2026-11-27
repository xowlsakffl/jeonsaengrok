import {recordSections} from './result-export.js';

const width = 960;
const margin = 65;
const innerWidth = width - 2 * margin;
const styles = {
  brand: ['700 30px LocalMyeongjo,serif', 44, '#f5edda'],
  title: ['700 54px LocalMyeongjo,serif', 75, '#243f33'],
  role: ['700 32px LocalSuit,sans-serif', 49, '#714831'],
  meta: ['400 27px LocalSuit,sans-serif', 42, '#58695b'],
  summary: ['700 32px LocalMyeongjo,serif', 51, '#334f3d'],
  heading: ['700 34px LocalMyeongjo,serif', 53, '#81452e'],
  body: ['400 30px LocalSuit,sans-serif', 49, '#292e28'],
  source: ['400 24px LocalSuit,sans-serif', 38, '#50604f'],
};

function wrap(ctx, paragraph) {
  const lines = [];
  let line = '';
  for (const word of paragraph.trim().split(/\s+/)) {
    const candidate = line ? line + ' ' + word : word;
    if (ctx.measureText(candidate).width <= innerWidth) { line = candidate; continue; }
    if (line) lines.push(line);
    line = '';
    for (const char of word) {
      if (line && ctx.measureText(line + char).width > innerWidth) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function layoutRecord(ctx, reading, options = {}) {
  const rows = [];
  let y = 39;
  function add(text, style) {
    if (!text) return;
    const [font, step, color] = styles[style];
    ctx.font = font;
    for (const paragraph of text.split(/\r?\n/)) {
      if (!paragraph.trim()) { y += 16; continue; }
      for (const line of wrap(ctx, paragraph)) {
        rows.push({y, text: line, font, color});
        y += step;
      }
    }
  }
  add('전생록   前生錄', 'brand');
  y = 153;
  add(reading.title, 'title');
  y += 14;
  add(reading.role, 'role');
  add([reading.era, reading.place].filter(Boolean).join(' · '), 'meta');
  y += 24;
  add(reading.summary, 'summary');
  for (const section of recordSections(reading, options)) {
    y += 34;
    rows.push({y, rule: true});
    y += 24;
    add(section.heading, 'heading');
    y += 5;
    add(section.body, 'body');
    for (const source of section.sources || []) {
      add(source.label, 'source');
      add(source.url, 'source');
    }
  }
  y += 42;
  add('전생록 · 역사에서 영감을 얻은 창작 이야기', 'meta');
  return {rows, height: y + 49};
}

function paint(ctx, layout, top, height) {
  ctx.fillStyle = '#fcf8ee';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(0, -top);
  ctx.fillStyle = '#2f5144';
  ctx.fillRect(0, 0, width, 105);
  ctx.fillStyle = '#b59c6d';
  ctx.fillRect(0, 105, width, 4);
  ctx.textBaseline = 'top';
  for (const row of layout.rows) {
    if (row.y + 80 < top || row.y >= top + height) continue;
    if (row.rule) {
      ctx.fillStyle = '#cfc1a7';
      ctx.fillRect(margin, row.y, innerWidth, 2);
    } else {
      ctx.font = row.font;
      ctx.fillStyle = row.color;
      ctx.fillText(row.text, margin, row.y);
    }
  }
  ctx.restore();
}

const crcTable = Uint32Array.from({length: 256}, (_, i) => {
  let crc = i;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  return crc >>> 0;
});
function pngChunk(type, data) {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(new TextEncoder().encode(type), 4);
  chunk.set(data, 8);
  let crc = 0xffffffff;
  for (const b of chunk.subarray(4, 8 + data.length)) crc = (crc >>> 8) ^ crcTable[(crc ^ b) & 255];
  view.setUint32(8 + data.length, (crc ^ 0xffffffff) >>> 0);
  return chunk;
}

// Stream scanlines from a small canvas so the full-length PNG also fits mobile canvas limits.
async function tallPng(canvas, layout) {
  canvas.height = 256;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const compressor = new CompressionStream('deflate');
  const output = new Response(compressor.readable).arrayBuffer();
  const writer = compressor.writable.getWriter();
  const stride = width * 4;
  for (let top = 0; top < layout.height; top += canvas.height) {
    const height = Math.min(canvas.height, layout.height - top);
    paint(ctx, layout, top, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const scanlines = new Uint8Array((stride + 1) * height);
    for (let row = 0; row < height; row++) {
      scanlines.set(pixels.subarray(row * stride, (row + 1) * stride), row * (stride + 1) + 1);
    }
    await writer.write(scanlines);
  }
  await writer.close();
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, layout.height);
  header[8] = 8;
  header[9] = 6;
  return new Blob([Uint8Array.of(137,80,78,71,13,10,26,10), pngChunk('IHDR', header),
    pngChunk('IDAT', new Uint8Array(await output)), pngChunk('IEND', new Uint8Array())], {type:'image/png'});
}

export async function recordImage(reading, options) {
  const headings = recordSections(reading,options).map(section => section.heading);
  const serifText = ['전생록 前生錄',reading.title,reading.summary,...headings].join(' ');
  await Promise.all([document.fonts.load(styles.title[0],serifText), document.fonts.load(styles.body[0])]);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const layout = layoutRecord(ctx, reading, options);
  if (layout.height > 4096 && typeof CompressionStream === 'function') return tallPng(canvas, layout);
  canvas.height = layout.height;
  paint(ctx, layout, 0, layout.height);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
