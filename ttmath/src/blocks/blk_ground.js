  /* ===================== Campus ground: height grid rasterized from the real NASA mesh ===================== */
  var CG = { x0: -106, z0: -140, res: 0.5, nx: 236, nz: 264, h: null };   // covers the whole campus and the palace
  function buildCampusGround() {
    var nx = CG.nx, nz = CG.nz, res = CG.res, x0 = CG.x0, z0 = CG.z0, x1 = x0 + nx * res, z1 = z0 + nz * res;
    var h = new Float32Array(nx * nz).fill(-1e9), i, j, k;
    function splat(x, y, z) { var ii = Math.floor((x - x0) / res), jj = Math.floor((z - z0) / res); if (ii >= 0 && jj >= 0 && ii < nx && jj < nz) { var kk = jj * nx + ii; if (y > h[kk]) h[kk] = y; } }
    for (var mi = 0; mi < terrainMeshes.length; mi++) {
      var mesh = terrainMeshes[mi], bb = mesh.userData.box;
      if (bb.max.x < x0 || bb.min.x > x1 || bb.max.z < z0 || bb.min.z > z1) continue;
      var P = mesh.geometry.attributes.position.array, I = mesh.geometry.index.array;
      for (var t = 0; t < I.length; t += 3) {
        var ia = I[t] * 3, ib = I[t + 1] * 3, ic = I[t + 2] * 3;
        var ax = P[ia], ay = P[ia + 1], az = P[ia + 2], bx = P[ib], by = P[ib + 1], bz = P[ib + 2], cx = P[ic], cy = P[ic + 1], cz = P[ic + 2];
        var mnx = Math.min(ax, bx, cx), mxx = Math.max(ax, bx, cx), mnz = Math.min(az, bz, cz), mxz = Math.max(az, bz, cz);
        if (mxx < x0 || mnx > x1 || mxz < z0 || mnz > z1) continue;
        splat(ax, ay, az); splat(bx, by, bz); splat(cx, cy, cz);
        var i0 = Math.max(0, Math.ceil((mnx - x0) / res - 0.5)), i1 = Math.min(nx - 1, Math.floor((mxx - x0) / res - 0.5));
        var j0 = Math.max(0, Math.ceil((mnz - z0) / res - 0.5)), j1 = Math.min(nz - 1, Math.floor((mxz - z0) / res - 0.5));
        if (i1 < i0 || j1 < j0) continue;
        var det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
        if (Math.abs(det) < 1e-9) continue;
        for (j = j0; j <= j1; j++) {
          var pz = z0 + (j + 0.5) * res;
          for (i = i0; i <= i1; i++) {
            var px = x0 + (i + 0.5) * res;
            var l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / det, l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / det, l3 = 1 - l1 - l2;
            if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
            var y = l1 * ay + l2 * by + l3 * cy; k = j * nx + i; if (y > h[k]) h[k] = y;
          }
        }
      }
    }
    for (var pass = 0; pass < 24; pass++) {           // fill any holes from their neighbours
      var changed = false, nh = h.slice();
      for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
        k = j * nx + i; if (h[k] > -1e8) continue;
        var s = 0, c = 0;
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; var v = h[jj * nx + ii]; if (v > -1e8) { s += v; c++; } }
        if (c) { nh[k] = s / c; changed = true; }
      }
      h = nh; if (!changed) break;
    }
    for (k = 0; k < h.length; k++) if (h[k] < -1e8) h[k] = 0;
    CG.h = h;
  }
  function cgH(x, z) {
    if (!CG.h) return 0;
    var u = clamp((x - CG.x0) / CG.res - 0.5, 0, CG.nx - 1.001), v = clamp((z - CG.z0) / CG.res - 0.5, 0, CG.nz - 1.001);
    var i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, H = CG.h, W = CG.nx;
    var a = H[j * W + i], b = H[j * W + i + 1], c = H[(j + 1) * W + i], d = H[(j + 1) * W + i + 1];
    return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
  }

