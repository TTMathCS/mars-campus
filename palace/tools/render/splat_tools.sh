#!/bin/sh
# Build the splat-fitting tool, OpenSplat (github.com/pierotofy/OpenSplat, AGPL-3.0), for the CPU, in <dir> (default
# ./gs): a micromamba environment from conda-forge (LibTorch for the CPU, OpenCV, a C++ compiler, CMake), then OpenSplat
# built against it. About 15 minutes on a 4-core machine; needs conda.anaconda.org, conda-forge and github.com.
#   sh splat_tools.sh [dir]
# then fit with:
#   env MAMBA_ROOT_PREFIX=<dir>/mroot <dir>/mm/bin/micromamba run -p <dir>/env <dir>/OpenSplat/build/opensplat <dataset> ...
set -e
GS=$(mkdir -p "${1:-gs}" && cd "${1:-gs}" && pwd)
cd "$GS"
export MAMBA_ROOT_PREFIX="$GS/mroot"
if [ ! -x mm/bin/micromamba ]; then
  mkdir -p mm && curl -sSL https://conda.anaconda.org/conda-forge/linux-64/micromamba-2.9.0-0.tar.bz2 | tar -xj -C mm bin/micromamba
fi
if [ ! -d env ]; then
  mm/bin/micromamba create -y -p "$GS/env" -c conda-forge 'libtorch=*=cpu*' libopencv cxx-compiler cmake make pkg-config
fi
if [ ! -d OpenSplat ]; then
  git clone https://github.com/pierotofy/OpenSplat && (cd OpenSplat && git checkout -q 688944f)
fi
mkdir -p OpenSplat/build && cd OpenSplat/build
"$GS/mm/bin/micromamba" run -p "$GS/env" cmake -DCMAKE_BUILD_TYPE=Release -DGPU_RUNTIME=CPU -DCMAKE_PREFIX_PATH="$GS/env" .. > cmake.log
"$GS/mm/bin/micromamba" run -p "$GS/env" make -j"$(nproc)" > make.log
ls -la "$GS/OpenSplat/build/opensplat"
