/**
 * Print a array as hex.
 */
function arrayToString(array) {
  var str = "";
  for (var i = 0; i < array.length; i++) {
    str += array[i].toString(16).toUpperCase() + " "
  }
  return str;
}

/**
 * Terrible / minimal EBML stream implementation.
 */
function EBMLStream(buffer) {
  this.buffer = buffer;
  this.view = new DataView(buffer);
  this.offset = 0;
}

EBMLStream.prototype.assertSpaceAvailable = function(width) {
  if (this.buffer.byteLength - this.offset < width) {
    console.error("not enough space.");
  }
}

EBMLStream.prototype.num_size = function(num) {
  var bytes = 1;
  while ((num+1) >> bytes*7) bytes++;
  return bytes;
}

/**
 * Encode a number in EBML and put it in the stream.
 */
EBMLStream.prototype.putNum = function(num, bytes) {
  var needed_bytes = this.num_size(num);

  if (bytes == 0) {
    bytes = needed_bytes;
  }

  // 1ULL << bytes * 7
  num |= 0x0000000000000001 << bytes * 7;

  for (var i = bytes - 1; i >= 0; i--) {
    this.view.setUint8(this.offset, num >> i * 8);
    this.offset++;
  }
}

/**
 * Put a 16 bits numbers in the stream.
 */
EBMLStream.prototype.putUint16 = function(value) {
  this.view.setUint16(this.offset, value);
  this.offset+=2;
}

/**
 * pretend to put a master-element in a stream. in reallity, it only works for
 * the EBML (first four bytes).
 */
EBMLStream.prototype.putMaster = function(id, value) {
  this.assertSpaceAvailable(id.length + 8);
  this.view.setUint32(this.offset, id);
  this.offset+=4;
  this.view.setUint8(this.offset, 0x01);
  this.view.setUint32(this.offset, 0x01000000);
  this.offset+=4;
  this.view.setUint32(this.offset, 0x0000001f);
  this.offset+=4;
}

/**
 * Put an array in the stream, verbatim.
 */
EBMLStream.prototype.put = function(array) {
  this.assertSpaceAvailable(array.length);
  for (var i = 0; i < array.length; i++) {
    this.view.setUint8(this.offset, array[i]);
    this.offset++
  }
}


/**
 * hacked up webm/matroska muxer. Supports only two channels, no cues.
 */
function MKV() {
  /**
   * Those should contain Uint8Array.
   */
  this.header = null;
  this.offset = 0;
  this.segment = null;
  // cluster header. we only have one.
  this.cluster = null;
  // data, array of Uint8Array
  this.simpleblocks = [];
}

/**
 * When we are done, we can get the blob to use it into a <video> using that
 * method.
 */
MKV.prototype.get_blob() {
  var parts = [this.header, this.segment, this.cluster].push.apply(a, this.simpleblocks)
  // adjust the content-type to taste.
  return new Blob(parts, {type: "video/x-matroska"});
}

/**
 * Write the header.
 */
MKV.prototype.write_header = function() {
  this.header = new Uint8Array(22);
  stream = new EBMLStream(this.header);

  stream.putMaster(0x1A45DFA3, 0);
  // id + "matroska".
  stream.put([0x42, 0x82, 0x6d, 0x61, 0x74, 0x72, 0x6f, 0x73, 0x6b, 0x61]);
};

/**
 * Write the header for a segment.
 */
MKV.prototype.write_segment = function() {
  this.segment = new Uint8Array(9);
  stream = new EBMLStream(this.segment);
  stream.put([0x18, 0x53, 0x80, 0x67]);
  stream.put([0x01, 0x00, 0x00, 0x00, 0x00]);
}

/**
 * Write the header for a cluster. We only have one cluster.
 */
MKV.prototype.write_cluster = function() {
  this.cluster = new Uint8Array(12);
  stream = new EBMLStream(this.cluster);
  stream.put([0x1f, 0x43, 0xb6, 0x75]);
  stream.put([0x01, 0x00, 0x00, 0x00, 0x00]);
  // timecode 0.
  stream.put([0xe7, 0x81, 0x00]);
}

/**
 * Write a SimpleBlock.
 */
MKV.prototype.write_simple_block = function(data) {
  // length of the packet + 21 bytes max for the little header
  var array = new Uint8Array(data.data.length + 21);
  stream = new EBMLStream(array);

  // simpleblock id, one byte
  stream.put([0xa3]);
  // size, variable number of bytes
  stream.putNum(data.data.byteLength + 4, 0);
  // type on four bytes
  stream.put([0x80 | (data.type == "video" ? 1 : 2)]);
  // we have only one cluster that starts at 0, no need to adjust.
  // on 2 bytes
  if (data.pts > 65536) {
    alert("pts of " + data.pts + " will not fit in 16 bits");
  }
  stream.putUint16(data.pts);

  // flags : no lacing, display the frame, don't discard.
  stream.put([0x00]);

  stream.put(data.data);

  this.simpleblocks.push(array);
}

MKV.prototype.dump = function() {
  console.log(arrayToString(this.header));
  console.log(arrayToString(this.segment));
  console.log(arrayToString(this.cluster));
  for (var i = 0; i < this.simpleblocks.length; i++) {
    console.log(arrayToString(this.simpleblocks[i]));
  }
}

// for testing, in node.js for example.
//meh = new MKV();
//meh.write_header();
//meh.write_segment();
//meh.write_cluster();
//meh.write_simple_block({type:"audio", data: new Uint8Array(9), pts: 0});
//meh.write_simple_block({type:"video", data: new Uint8Array(118), pts: 70});

//meh.dump();

