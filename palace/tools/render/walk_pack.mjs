// The Crown walk: make the baked chunks (walk_bake.py) small for the browser. Faces drawn as baked (the texture or the
// vertices carry all their light) lose their normals; then every mesh is welded, quantized (KHR_mesh_quantization;
// the vertices' light in 16 bits, as it is linear) and compressed with meshoptimizer (EXT_meshopt_compression), which
// three.js's GLTFLoader reads with MeshoptDecoder.
//   npm install @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer
//   node walk_pack.mjs <baked dir> <out dir>        (copies walk.json, sky.jpg, floor.png and the light maps along;
//   the colour textures are inside the .glb files)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, quantize, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';
import path from 'path';

await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const [src, dst] = process.argv.slice(2);
fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src).sort()) {
  if (/\.(json|jpg|png)$/.test(f) && !/^c\d+(_c)?\.jpg$/.test(f) && !f.startsWith('_')) { fs.copyFileSync(path.join(src, f), path.join(dst, f)); continue; }
  if (!f.endsWith('.glb')) continue;
  const doc = await io.read(path.join(src, f));
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
    const kind = prim.getMaterial()?.getExtras()?.walk;
    if (kind === 'baked' || kind === 'vertex' || kind === 'glow') prim.setAttribute('NORMAL', null);
  }
  await doc.transform(prune(), dedup(), weld(),
    quantize({ quantizePosition: 14, quantizeTexcoord: 14, quantizeNormal: 8, quantizeColor: 16 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await io.write(path.join(dst, f), doc);
  console.log(f, (fs.statSync(path.join(src, f)).size / 1e6).toFixed(1), '->', (fs.statSync(path.join(dst, f)).size / 1e6).toFixed(1), 'MB');
}
