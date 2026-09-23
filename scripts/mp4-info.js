// Minimal MP4 box parser: report track durations + sample counts
const fs = require("fs");

const file = process.argv[2];
const buf = fs.readFileSync(file);

function readBox(offset, end) {
  const boxes = [];
  let pos = offset;
  while (pos + 8 <= end) {
    let size = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    let headerSize = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(pos + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = end - pos;
    }
    if (size < headerSize) break;
    boxes.push({ type, start: pos, dataStart: pos + headerSize, end: pos + size });
    pos += size;
  }
  return boxes;
}

function findBox(boxes, type) {
  return boxes.find((b) => b.type === type);
}

function recurse(box, path = []) {
  // walk children known containers
  const containers = ["moov", "trak", "mdia", "minf", "stbl", "edts"];
  if (!containers.includes(box.type)) return;
  const children = readBox(box.dataStart, box.end);
  for (const c of children) {
    c.parent = box;
    recurse(c, path);
  }
  box.children = children;
}

const top = readBox(0, buf.length);
const moov = findBox(top, "moov");
recurse(moov);

// mvhd
const mvhd = findBox(moov.children, "mvhd");
const version = buf[mvhd.dataStart];
let timescale, duration;
if (version === 1) {
  timescale = buf.readUInt32BE(mvhd.dataStart + 20);
  duration = Number(buf.readBigUInt64BE(mvhd.dataStart + 24));
} else {
  timescale = buf.readUInt32BE(mvhd.dataStart + 12);
  duration = buf.readUInt32BE(mvhd.dataStart + 16);
}
console.log(`Movie: ${(duration / timescale).toFixed(3)}s (timescale ${timescale})`);

for (const trak of moov.children.filter((b) => b.type === "trak")) {
  const mdia = findBox(trak.children, "mdia");
  const mdhd = findBox(mdia.children, "mdhd");
  const v = buf[mdhd.dataStart];
  let ts, dur;
  if (v === 1) {
    ts = buf.readUInt32BE(mdhd.dataStart + 20);
    dur = Number(buf.readBigUInt64BE(mdhd.dataStart + 24));
  } else {
    ts = buf.readUInt32BE(mdhd.dataStart + 12);
    dur = buf.readUInt32BE(mdhd.dataStart + 16);
  }
  const hdlr = findBox(mdia.children, "hdlr");
  const handler = buf.toString("ascii", hdlr.dataStart + 8, hdlr.dataStart + 12);

  // sample count from stsz
  const minf = findBox(mdia.children, "minf");
  const stbl = findBox(minf.children, "stbl");
  const stsz = findBox(stbl.children, "stsz");
  const sampleCount = buf.readUInt32BE(stsz.dataStart + 4);

  // stts: unique entries
  const stts = findBox(stbl.children, "stts");
  const entryCount = buf.readUInt32BE(stts.dataStart + 4);
  let totalSamples = 0;
  for (let i = 0; i < entryCount; i++) {
    totalSamples += buf.readUInt32BE(stts.dataStart + 8 + i * 8);
  }

  const trackDur = dur / ts;
  console.log(`Track ${handler}: ${trackDur.toFixed(3)}s, ${sampleCount} samples, stts total ${totalSamples}`);
  if (handler === "vide") {
    console.log(`  → fps = ${(totalSamples / trackDur).toFixed(3)}`);
  }

  // edts/elst (edit list — can shift start)
  const edts = findBox(trak.children, "edts");
  if (edts) {
    const elst = findBox(readBox(edts.dataStart, edts.end), "elst");
    if (elst) {
      const cnt = buf.readUInt32BE(elst.dataStart + 4);
      const ver = buf[elst.dataStart];
      let p = elst.dataStart + 8;
      for (let i = 0; i < cnt; i++) {
        if (ver === 1) {
          const segDur = Number(buf.readBigUInt64BE(p));
          const mediaTime = Number(buf.readBigUInt64BE(p + 8));
          const rate = buf.readInt32BE(p + 16);
          console.log(`  elst: segDur=${(segDur / ts).toFixed(3)}s mediaTime=${mediaTime} rate=${(rate / 65536).toFixed(2)}`);
          p += 20;
        } else {
          const segDur = buf.readUInt32BE(p);
          const mediaTime = buf.readInt32BE(p + 4);
          const rate = buf.readInt32BE(p + 8);
          console.log(`  elst: segDur=${(segDur / ts).toFixed(3)}s mediaTime=${mediaTime} rate=${(rate / 65536).toFixed(2)}`);
          p += 12;
        }
      }
    }
  }
}
