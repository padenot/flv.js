## flv.js, flv demuxer in javascript

Largely inspired by the flv demuxer from ffmpeg ( `ffmpeg/libavformat/flvdec.c` ).

- `README.md`: this file.
- `ogg.js` : demuxer implementation and supporting code.
- `mkv.js` : a terrible muxer for then mkv format, that support the minimum
  possible.
- `filelist.json` : JSON file that list files to XHR.
- `upload_files.js` and `index.html` : test code.
- `media`: contains the media we want to demux, and other media.

