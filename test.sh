#!/bin/sh

# Dumps packets from the same file, using flv.js (running in node) and ffmpeg's
# tool pktdumper.c, slightly modified. They should be identical.

# a pktdumper tool is assumed to be in the PATH.

pktdumper media/short.flv
node flv.js media/short.flv

diff ffmpeg-packet-dump/ flvjs-packet-dump/
