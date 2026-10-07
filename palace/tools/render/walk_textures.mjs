// The Crown walk: the colour textures of chunks already packed, brought down to at most WALK_TEX pixels a side (2048),
// in place: the graphics card holds a quarter as much and they load faster. node walk_textures.mjs <data dir>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const TEX = +(process.env.WALK_TEX || 2048), dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter(f => /^c\d{4}\.glb$/.test(f)).sort()) {
  const p = path.join(dir, f), before = fs.statSync(p).size, doc = await io.read(p);
  const big = doc.getRoot().listTextures().some(t => (t.getSize() || [0])[0] > TEX);
  if (!big) { console.log(f, 'already', TEX); continue; }
  await doc.transform(textureCompress({ encoder: sharp, resize: [TEX, TEX], targetFormat: 'jpeg', quality: 86 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await io.write(p, doc);
  console.log(f, (before / 1e6).toFixed(1), '->', (fs.statSync(p).size / 1e6).toFixed(1), 'MB');
}
