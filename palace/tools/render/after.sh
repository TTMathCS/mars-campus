#!/bin/sh
# wait for a process to end, then start a lane's runner: after.sh <pid> <lane>
cd "$(dirname "$0")/.."
while kill -0 "$1" 2>/dev/null; do sleep 15; done
exec python3 blend/runner.py "$2"
