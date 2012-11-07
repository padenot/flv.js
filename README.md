## flv.js, flv demuxer in javascript

Largely inspired by the flv demuxer from ffmpeg ( `ffmpeg/libavformat/flvdec.c` ).

- `README.md`: this file.
- `flv.js` : demuxer implementation and supporting code.
- `index.html`: web page to test the library
- `upload_files.js`: supporting code to test the code in a browser.
- `mkv.js` : a terrible muxer for then mkv format, that support the minimum
  needed to mux a somewhat valid mkv file. This is not tested yet.
- `media`: contains the media we want to demux, and other media.
- `test.sh`: test that compare the packets extracted by ffmpeg and flv.js. See
  the Testing section.
- `pktdumper-output.patch`: a patch to tweak the output of the `pktdumper`
  utility. See the Testing section.
- `LICENSE`: Those files are under the MPL License.

## Testing
For testing the demuxer, you need a copy of ffmpeg, see the instruction here:
<http://ffmpeg.org/download.html>.

Maybe you can go without building your copy. For example, on a debian-like
system, you install the following:

```sh
sudo aptitude install libavformat-dev libavfilter-dev libavdevice-dev libavcodec-dev libavutil-dev
```

This directly installs the ffmpeg libraries that would have been built.
Otherwise, just build it.

Then, go in the ffmpeg directory, and run:

```sh
patch -p1 < pktdumper-output.patch
gcc -I. -I.. tools/pktdumper.c -lavformat -lavfilter -lavdevice -lavcodec -lavutil  -lavutil -o ~/bin/pktdumper
```

to build the packet dumper utility. You might want to adjust the output location
(after the `-o` option). We consider `ffmpeg` a reference implementation. The
test consists in comparing what we dump using `flv.js` an `ffmpeg`. We assume
that if we can extract the same packet, the demuxing is correct.

When you've made sure that `pktdumper` is in your `PATH` environment variable,
just run `test.sh`. This essentially dump the packets using `ffmpeg` and
`flv.js`, in two separate directory, but with the same names, using the little
patch above. Then `diff` is ran on those directories. If `flv.js` did its job
correctly, the only difference should be a `metadata` file in the directory
where `flv.js` dumped the packets, that contains the metadata of this flv file.
