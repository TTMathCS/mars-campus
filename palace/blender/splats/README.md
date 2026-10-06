# Arcadia's rooms as Gaussian splats

Jim, 6 Oct 2026: "try to use gaussian splatting if possible. I heard it is pretty good for real experience?" and
"maybe show me something gaussian splatting can do first, then we can move ahead?"

A Gaussian splat is a cloud of soft, coloured, see-through blobs fitted to many pictures of a place. A browser draws
it in real time, so a visitor can stand in the room and look and step about, and the room looks as the path tracer
drew it: the light, the soft shadows, the plants, the paintings. The page is [`palace/splat/`](../../splat/)
(drawn by [Spark](https://sparkjs.dev), MIT, in `palace/splat/lib/`; three.js is the walk's copy in
`palace/walk/lib/`).

## How a room is made

1. **Views.** [`splat_views.py`](../../tools/render/splat_views.py) builds the room from the same scripts as the stills
   and path-traces it from a rig of cameras round the room's 360 stop: 13 places within 2.4 m of it, at three heights
   (1.4, 1.6 and 1.85 m), each looking all round at 45° steps, and up and down, 208 views (the test rig: one
   place, 12 views). No glow or vignette, and one grading curve for all, so every view agrees. It writes the poses in
   a nerfstudio `transforms.json` and a cloud of points sampled from the room's surfaces, coloured from the views,
   with a far sphere of points for the sky and the plain seen through the windows, to start from.

       bvenv/bin/python blend/splat_views.py bedroom gs/demo_bedroom 640 360 24 -0.2 --rig full --spread 2.4

2. **Fitting.** [OpenSplat](https://github.com/pierotofy/OpenSplat) (AGPL-3.0, used as a tool, not shipped) fits the
   splat. The render machines have no graphics card, so it is built for the CPU against LibTorch and OpenCV from
   conda-forge (a micromamba environment: `libtorch=*=cpu*`, `libopencv`, `cxx-compiler`, `cmake`), then
   `cmake -DGPU_RUNTIME=CPU ..`. On a CPU it is about a hundred times slower than on a graphics card, so the views are
   kept small (640 x 360) and the fitting short.

       opensplat gs/demo_bedroom -n 3000 --sh-degree 2 -o gs/demo_bedroom/splat.ply

3. **Publishing.** The fitted splat is written as `.spz` (compressed) into `palace/splat/data/`, and the room is listed
   in `palace/splat/data/rooms.json` with where its rig stood (`centre`, in the design's metres), how far you may step
   from it (`reach`) and which way you face first (`yaw0`).

## What is kept here

For each room: `transforms.json`, `points.ply` and the graded `images/` (enough to fit the splat again, with more
iterations or on a graphics card), and the fitted splat.
