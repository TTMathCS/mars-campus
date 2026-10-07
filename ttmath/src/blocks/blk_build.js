  /* ===================== Building the campus ===================== */
  var campus = null, wings = null, drape = null, campusTarget = new THREE.Vector3(), campusGoal = new THREE.Vector3();
  var COLL = { posts: [], rovers: [] };
  var GLASS_MESHES = [], DOOR_MESHES = [];
  function glassPair(g, order) {
    var out = [];
    [THREE.BackSide, THREE.FrontSide].forEach(function (side, i) { var m = new THREE.Mesh(g, glassMat(side)); m.renderOrder = order + i; m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m); GLASS_MESHES.push(m); out.push(m); });
    return out;
  }
  // glass of a hall open to the sky: from inside it mirrors the day outside, not a room (GLASS_FS, vK.y 4)
  function hallGlass(G) { for (var k = 1; k < G.f2.length; k += 2) if (G.f2[k] > 0.5 && G.f2[k] < 2.5) G.f2[k] = 4; return G; }
  function buildCampus() {
    buildCampusGround();
    // palace levels from the ground around the dome ring
    var acc = 0; for (var k = 0; k < 96; k++) { var pp = palPol(PAL.R, k / 96 * 2 * Math.PI); acc += cgH(pp.x, pp.z); }
    PALY.B = acc / 96 + 0.3; PALY.F = PALY.B - PAL.depth; PALY.front = PALY.B;   // the palace's door opens onto the garden ring, level with the balcony
    U.uCut.value.set(PAL.c.x, PAL.c.z, PAL.R + 0.1, 1); U.uCutV.value.set(PAL.F.x, PAL.F.z, 4.45, PAL.vFront + 0.1);
    var mc = U.uSynthMeanC.value; matU.uDustC.value.set(Math.pow(mc.x, 2.2), Math.pow(mc.y, 2.2), Math.pow(mc.z, 2.2)).multiplyScalar(0.95);
    // rovers: by the avenue beside the airlock, facing it; behind the Ring's right side, where the ground falls, nose to it
    var r1 = palXZ(9.8, 84.5), r2 = palXZ(71.5, -19.2);
    ROVER_BAYS = [{ x: r1.x, z: r1.z, yaw: Math.atan2(-PAL.Rt.x, -PAL.Rt.z) }, { x: r2.x, z: r2.z, yaw: Math.atan2(PAL.c.x - r2.x, PAL.c.z - r2.z) }];
    PLAZA.c = palXZ(0, 91.5);
    buildPalace();                                                      // interior, dome glass and the moving pieces
    var B = new Builder(), W = new Builder(), D = new Builder();
    campusExterior(B); backDoor(B); crescentBuild(B, W); gardenRing(B); entranceBuild(B); drapeGeometry(D);   // all the lights exist once these are built
    campus = bakedMesh(B, matMat); scene.add(campus);
    wings = bakedMesh(W, matMat); scene.add(wings);
    drape = bakedMesh(D, matDrape, null, null, { noOcclude: true }); drape.renderOrder = 1; scene.add(drape);
    // glass: the dome first, then the wing facades and the links
    var gg = domeGlassGeometry(); var pd = glassPair(gg, 6); palGlassB = pd[0]; palGlassF = pd[1];
    glassPair(BACK_GLASS.build(), 8); glassPair(CRS_GLASS.build(), 8); glassPair(hallGlass(GRD_GLASS).build(), 10); glassPair(hallGlass(ENT_GLASS).build(), 10);
    // sliding doors: frames and glass built where they stand closed, moved along the facade when someone comes near
    DOORS.forEach(function (d) {
      d.leaves.forEach(function (lf) {
        var M = d.M || wingFrame(d.sg, d.s, 0.12, d.y), fb = new Builder(), gb = new Builder(); fb.zone = ZONE.OUT; fb.add(lf.frame, M); gb.add(lf.glass, M); if (d.hall) hallGlass(gb);
        lf.fm = bakedMesh(fb, matMat, campusLights, null, { noOcclude: true }); BAKE.meshes.pop(); scene.add(lf.fm); DOOR_MESHES.push(lf.fm);
        lf.gm = glassPair(gb.build(), 12);
      });
    });
    // discovery: the front of the dome is what shows first; the pin and the distance point to the entrance's airlock
    var ft = palXZ(0, 17); campusTarget.set(ft.x, domeY(17) + 0.2, ft.z);
    var dg = palXZ(0, P2.entrance.airlock.s1); campusGoal.set(dg.x, PALY.B + P2.entrance.airlock.h + 2.6, dg.z);
    // light on the open ground: at the airlock, in the entrance dome, by the rover, on the logo wall
    var lg = palXZ(0, 89); LP[0].set(lg.x, cgH(lg.x, lg.z) + 2.4, lg.z, 16); LC[0].set(1.0, 0.86, 0.66).multiplyScalar(4);
    var ld = palXZ(0, 72); LP[1].set(ld.x, PALY.B + 3.2, ld.z, 20); LC[1].set(1.0, 0.86, 0.66).multiplyScalar(5);
    var lr = palXZ(8, 82); LP[2].set(lr.x, cgH(lr.x, lr.z) + 3, lr.z, 12); LC[2].set(1.0, 0.86, 0.66).multiplyScalar(2);
    var spn = SIGNP.at(0, SIGNP.T / 2 + 1.3); LP[3].set(spn.x, cgH(spn.x, spn.z) + 0.3, spn.z, 9); LC[3].set(0.75, 0.85, 1.0).multiplyScalar(4);
    var ll = palXZ(-8, 82); LP[4].set(ll.x, cgH(ll.x, ll.z) + 3, ll.z, 12); LC[4].set(1.0, 0.86, 0.66).multiplyScalar(2);
    // reflections: captured in the rotunda, in the math classroom and out in the courtyard
    envIn.pos.set(PAL.c.x, PALY.B + 2.0, PAL.c.z);
    var wp = crsPt(55.8, 16 * D2R); envW.pos.set(wp.x, CRS.yU + 1.6, wp.z);                         // in Euclid
    var cp = palXZ(0, 92); envOut.pos.set(cp.x, cgH(cp.x, cp.z) + 2.0, cp.z);
    podInit();                                                          // the pod waiting at the dock
  }
  // doors open as you come near; reflections refresh as the sky changes
  function campusUpdate(time, dt) { doorsUpdate(dt); stepEnv(); screensUpdate(time); }
  // a door with a partner (d.lock: the airlock's other doors) opens only once its partner has closed, and when both are
  // wanted the one nearer to you goes first, so the airlock's two pairs are never open together
  function doorsUpdate(dt) {
    var i, d, L;
    for (i = 0; i < DOORS.length; i++) { d = DOORS[i]; d.dist = Math.hypot(px - d.c.x, pz - d.c.z); d.want = d.dist < 3.4 && !POD.flying; }
    for (i = 0; i < DOORS.length; i++) {
      d = DOORS[i]; L = d.lock;
      var tgt = d.want && !(L && (L.open > 0.02 || (L.want && L.dist < d.dist))) ? 1 : 0;
      if (Math.abs(tgt - d.open) < 1e-3 && d.set) continue;
      d.open += (tgt - d.open) * Math.min(1, dt * 3.5); if (tgt === 0 && d.open < 0.01) d.open = 0; d.set = true;
      d.leaves.forEach(function (lf) { var o = lf.side * d.open * 1.16, x = d.dir.x * o, z = d.dir.z * o; [lf.fm].concat(lf.gm).forEach(function (m) { m.matrix.makeTranslation(x, 0, z); m.matrixWorldNeedsUpdate = true; }); });
    }
  }
  function blockedByBuilding(x, z) {
    for (var i = 0; i < COLL.posts.length; i++) { var p = COLL.posts[i], dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz < p.r * p.r) return true; }
    for (var r = 0; r < COLL.rovers.length; r++) { var dx2 = x - COLL.rovers[r].x, dz2 = z - COLL.rovers[r].z; if (dx2 * dx2 + dz2 * dz2 < 7.5) return true; }
    for (var q = 0; q < POD.list.length; q++) { var pd = POD.list[q]; if (pd !== POD.cur && !(PDK && PDK.pod === pd) && Math.hypot(x - pd.x, z - pd.z) < 2.2) return true; }   // a parked pod (at the dock the collar's floor ends at its canopy)
    if (SIGNP.n) {
      var lx = x - SIGNP.c.x, lz = z - SIGNP.c.z, s = lx * SIGNP.t.x + lz * SIGNP.t.z, o = lx * SIGNP.n.x + lz * SIGNP.n.z + s * s / 24;
      if (Math.abs(s) < SIGNP.W / 2 + 0.35 && Math.abs(o) < SIGNP.T / 2 + 0.35) return true;
    }
    return false;
  }
  // where you can stand: each part answers for its own ground (undefined: not mine, NaN: blocked); the garden ring takes
  // what is left between the dome and the Ring
  function campusSupport(x, z, yf) {
    if (podDockBlocked(x, z, yf)) return NaN;                         // the dock's columns
    var v = podDockSupport(x, z, yf); if (v !== undefined) return v;   // its bridge and collar
    v = entranceSupport(x, z, yf); if (v !== undefined) return v;
    v = crescentSupport(x, z, yf); if (v !== undefined) return v;
    v = backSupport(x, z, yf); if (v !== undefined) return v;
    v = palSupport(x, z, yf); if (v !== undefined) return v;
    return gardenSupport(x, z, yf);
  }
  function campusInside(x, z) { return Math.max(palInside(x, z), backInside(x, z), crescentInside(x, z), gardenInside(x, z), entranceInside(x, z)); }
