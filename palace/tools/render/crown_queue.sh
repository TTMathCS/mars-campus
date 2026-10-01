#!/bin/sh
# The Crown's rooms, finals: a still and a 360 each. Waits for the Pentagon queue to finish first (one render at a
# time uses all four cores). A picture that exists is skipped, so this can be started again after an interruption.
cd "$(dirname "$0")/.."
while pgrep -f "blend/final.py" > /dev/null; do sleep 30; done
mkdir -p final/crown
for spec in "salon salon,pano:salon 1.0" "bedroom bedroom2,pano:bedroom 1.5" "dining dining,pano:dining 1.0" "arrival arrival,pano:arrival 1.0" "sunset sunset2,pano:sunset 1.0"; do
  set -- $spec
  nice -n 5 ./bvenv/bin/python blend/crown_rooms.py $1 $2 "final/crown/%s.jpg" 1600 900 96 $3 4096 28 >> blend/log_crown_queue.txt 2>&1
done
echo CROWN-QUEUE-DONE >> blend/log_crown_queue.txt
