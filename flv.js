/*jshint curly:true, latedef:true, undef:true, browser:true, devel:true, loopfunc:true */
/**
 * An FLV demuxer in js
 */

/**
 * Enable logging.
 */
var debug = true;

/**
 * Misc util functions.
 */
var Util = {
  /**
   * alert() a stack trace.
   */
  stacktrace : function() {
    try {
      throw new Error(4);
    } catch (e) {
        alert(e.stack);
    }
  },
  /**
   * Return true if two arrays are equal, false otherwise.
   */
  compareArray : function(lhs, rhs) {
    if (lhs.length != rhs.length) {
      return false;
    }
    for(var i = 0; i < lhs.length; i++) {
      if (lhs[i] != rhs[i]) {
        return false;
      }
    }
    return true;
  },
  /**
   * Turn a array-like object into a string. This assumes that the values of the
   * elements in the array are in the range [0; 255].
   */
  asciiArrayToString : function(array) {
    var str = "";
    for (var i = 0; i < array.length; i++) {
      str += String.fromCharCode(array[i]);
    }
    return str;
  },
  /**
   * Turns an arra-like object into a comma separated list of values, for
   * debugging purposes.
   */
  arrayToString : function(array) {
    var str = "";
    for (var i = 0; i < array.length; i++) {
      str += parseInt(array[i], 10) + ", ";
    }
    return str;
  },
  /**
   * If debug mode is enabled, allow to log something.
   */
  add_trace : function(message, status) {
    if (status === undefined) {
      status = "trace";
    }
    if (debug) {
      var t = document.querySelector("ul#trace");
      var li = document.createElement('li');
      li.innerHTML = message;
      switch (status) {
        case true:
          li.className = "ok";
        break;
        case false:
          li.className = "ko";
        break;
      }
      t.appendChild(li);
    }
  },
  /**
   * Assert an expression is true, and log.
   */
  assert : function(predicate, msg, offset, begin, end) {
    if (predicate) {
      Util.add_trace(msg, true);
    } else {
      Util.add_trace(msg, false);
    }
  },
  /** Asynchronously get a portion of a blob.
   *
   * - blob is a blob.
   * - type is either "binary", "ascii" or "utf-8", depending on the result we
   *   want.
   * - begin and end are the range we want from the blob.
   * - callback is a function that accepts two arguments, and error (string),
   *   and the resulting data.
   */
  get : function(blob, type, begin, end, callback) {
    var file = new FileReader(),
    part = blob.slice(begin, end);
    if(end <= begin) {
      alert(Util.stacktrace());
    }

    if (part.size == 0) {
      alert("null blob.");
    }

    file.onloadend = function() {
      callback(undefined, file.result);
    };
    file.onerror = function(e) {
      callback("Error decoding blob into " + type + " from " + begin + " to " + end + ". " + e,
               undefined);
    };

    switch(type) {
      case "ascii":
        file.readAsBinaryString(part);
      break;
      case "utf-8":
        file.readAsText(part, "utf-8");
      break;
      case "binary":
        file.readAsArrayBuffer(part);
      break;
      default:
        throw "not supported";
    }
  }
};

/**
 * An object that allows the consumption of a binary data stream, getting
 * elements of various type and width.
 *
 * - array is a ArrayBuffer
 */
function BinaryStream(array) {
  this.buffer = array;
  // in bytes
  this.index = 0;
}

BinaryStream.prototype.getUint32 = function() {
  this.assertDataAvailable(4);
  var int = DataView(this.buffer).getUint32(this.index);
  this.index += 4;
  return int;
};

BinaryStream.prototype.getUint32BE = function() {
  this.assertDataAvailable(4);
  var bytes = new Uint8Array(this.buffer, this.index, 4);
  var int = bytes[0] << 24 |
            bytes[1] << 16 |
            bytes[2] << 8  |
            bytes[3];
  this.index += 4;
  return int;
};

BinaryStream.prototype.getUint24 = function() {
  this.assertDataAvailable(3);
  return this.getUint16() << 8 |
         this.getUint8();
}

BinaryStream.prototype.getUint16BE = function() {
  this.assertDataAvailable(2);
  var bytes = new Uint8Array(this.buffer, this.index, 2);
  var int = bytes[0] << 8 | bytes[1];
  this.index += 2;
  return int;
}

BinaryStream.prototype.getUint16 = function() {
  this.assertDataAvailable(2);
  var int = DataView(this.buffer).getUint16(this.index);
  this.index += 2;
  return int;
}

BinaryStream.prototype.getInt32 = function() {
  this.assertDataAvailable(4);
  var int = DataView(this.buffer).getInt32(this.index);
  this.index += 4;
  return int;
};

BinaryStream.prototype.getUint8 = function() {
  var int = this.peekUint8();
  this.index++;
  return int;
};

BinaryStream.prototype.peekUint8 = function() {
  this.assertDataAvailable(1);
  var int = DataView(this.buffer).getUint8(this.index);
  return int;
};

BinaryStream.prototype.getInt8 = function() {
  this.assertDataAvailable(1);
  var int = DataView(this.buffer).getInt8(this.index++);
  this.index++;
  return int;
};

BinaryStream.prototype.getUint8Array = function(len) {
  this.assertDataAvailable(len);
  var int8array = Uint8Array(this.buffer, this.index, len);
  this.index += len;
  return int8array;
};

BinaryStream.prototype.getDouble = function() {
  this.assertDataAvailable(8);
  var double = DataView(this.buffer).getFloat64(this.index);
  this.index += 8;
  return double;
};

BinaryStream.prototype.getCharArray = function(len) {
  var a = this.getUint8Array(len);
  return Util.asciiArrayToString(a);
};

BinaryStream.prototype.skip = function(len) {
  this.assertDataAvailable(len);
  this.index += len;
};

BinaryStream.prototype.assertDataAvailable = function(len) {
  if (this.index + len > this.buffer.byteLength) {
    alert("no data available : " +
          "index : " + this.index +
          " + len : " + len +
          " > buffer len : " + this.buffer.byteLength);
    alert(Util.stacktrace());
  }
};

BinaryStream.prototype.parsedBytes = function() {
  return this.index;
};

BinaryStream.prototype.available = function() {
  return this.buffer.byteLength - this.index;
}



/**
 * This is the meat of our flv demuxer. Most of the logic is borrowed from the
 * flv demuxer of ffmpeg, adapted for js, and stripped out of a lot of things.
 *
 * - blob is obviously the blob that contains the data you want to parse (i.e. the
 *   flv file.)
 * - data_callback is a function that is called when a new packet has been
 *   extracted. This function expects two arguments: the string "audio",
 *   "video", "metadata" or "eof" for the type of the packet. If the packet type
 *   is "audio" or "video", the second argument is a object that has the
 *   following layout:
 *
 *   {
 *     pts: time stamp in ms, // the time at which this
 *                            // packet should be  presented
 *     data: ArrayBuffer      // the actual data of the packet
 *   }
 *
 *   If the type is "metadata", then the second argument is a object that
 *   contains the metadata.
 *
 *   If the type is "eof", the second argument is |undefined|, and we reached
 *   the end of the file.
 *
 * - error_callback is called is something is wrong. It has one argument that is
 *   a string that describes the error.
 */

function FlvFile(blob, data_callback, error_callback) {
  // blob we get from the xhr
  this.blob = blob;
  // where to read in the blob next time.
  this.offset = 0;

  this.data_callback = data_callback;
  this.error_callback = error_callback;

  // the string "FLV", in hex.
  this.FLV_STRING = [0x46, 0x4c, 0x56];

  // Then, a bunch of constants, that have the same value than in ffmpeg.
  this.FLV_HAS_VIDEO = 1;
  this.FLV_HAS_AUDIO = 4;

  // Packet type
  this.FLV_TAG_TYPE_AUDIO = 0x08;
  this.FLV_TAG_TYPE_VIDEO = 0x09;
  this.FLV_TAG_TYPE_META  = 0x12;

  // Stream type
  this.FLV_STREAM_TYPE_VIDEO = 0;
  this.FLV_STREAM_TYPE_AUDIO = 1;
  this.FLV_STREAM_TYPE_DATA = 2;
  this.FLV_STREAM_TYPE_NB = 3;
  this.stream_type_to_str = [
    "video",
    "audio",
    "data",
    "nb"
  ];

  // Various mask to get info from packets.
  this.FLV_AUDIO_CHANNEL_MASK    = 0x01;
  this.FLV_AUDIO_SAMPLESIZE_MASK = 0x02;
  this.FLV_AUDIO_SAMPLERATE_MASK = 0x0c;
  this.FLV_AUDIO_CODECID_MASK    = 0xf0;
  this.FLV_VIDEO_CODECID_MASK    = 0x0f;
  this.FLV_VIDEO_FRAMETYPE_MASK  = 0xf0;

  this.FLV_MONO   = 0;
  this.FLV_STEREO = 1;

  this.FLV_VIDEO_FRAMETYPE_OFFSET = 4;
  this.FLV_FRAME_VIDEO_INFO_CMD =  5 << this.FLV_VIDEO_FRAMETYPE_OFFSET;

  // AMF datatype
  this.AMF_DATA_TYPE_NUMBER      = 0x00;
  this.AMF_DATA_TYPE_BOOL        = 0x01;
  this.AMF_DATA_TYPE_STRING      = 0x02;
  this.AMF_DATA_TYPE_OBJECT      = 0x03;
  this.AMF_DATA_TYPE_NULL        = 0x05;
  this.AMF_DATA_TYPE_UNDEFINED   = 0x06;
  this.AMF_DATA_TYPE_REFERENCE   = 0x07;
  this.AMF_DATA_TYPE_MIXEDARRAY  = 0x08;
  this.AMF_DATA_TYPE_OBJECT_END  = 0x09;
  this.AMF_DATA_TYPE_ARRAY       = 0x0a;
  this.AMF_DATA_TYPE_DATE        = 0x0b;
  this.AMF_DATA_TYPE_LONG_STRING = 0x0c;
  this.AMF_DATA_TYPE_UNSUPPORTED = 0x0d;

  this.FLV_AUDIO_SAMPLESSIZE_OFFSET = 1;
  this.FLV_AUDIO_SAMPLERATE_OFFSET  = 2;
  this.FLV_AUDIO_CODECID_OFFSET     = 4;

  this.FLV_VIDEO_FRAMETYPE_OFFSET   = 4;

  this.FLV_CODECID_AAC = 10 << this.FLV_AUDIO_CODECID_OFFSET;

  this.FLV_CODECID_H264     = 7;

  this.AV_TIME_BASE = 1000000;

  this.trust_metadata = true;

  // Extra data present in the first AAC and H264 packets.
  this.extradata = {
    audio: null,
    video: null
  }

  // Not realy used per now, we don't really validate the time stamps.
  this.flv_state = {
    validate_index : [
      {dts : 0,
       pos : 0},
      {dts : 0,
       pos : 0}
    ],
    validate_next: 0,
    validate_count: 0,
    searched_for_end: 0
  };

  // Various infos for the streams.
  this.streams = {
    audio : [],
    video : []
  }
  // the metadata
  this.metadata = {};
}

FlvFile.prototype.stream_count = function() {
  return this.streams.audio.length + this.streams.video.length;
}

FlvFile.prototype.parse = function() {
  this.parse_header(this.parse_packet);
};

// Helper to get and AMF string (16 bits length followed by an array of ascii char)
FlvFile.prototype.get_amf_string = function(stream) {
  var len = stream.getUint16();
  console.len("len: " + len);
  return stream.getCharArray(len);
}

// Parses the minimal subset of AMF needed to get the info about this video.
FlvFile.prototype.parse_amf_object = function(stream, depth, key) {
  var amf_type = stream.getUint8(),
                 num_val,
                 str_val;
  switch(amf_type) {
    case this.AMF_DATA_TYPE_NUMBER:
      num_val = stream.getDouble();
      break;
    case this.AMF_DATA_TYPE_BOOL:
      num_val = stream.getUint8();
      break;
    break;
    case this.AMF_DATA_TYPE_STRING:
      str_val = this.get_amf_string(stream);
    break;
    case this.AMF_DATA_TYPE_OBJECT:
      // TODO handle that to get keyframes array or something.
    break;
    case this.AMF_DATA_TYPE_NULL:
    case this.AMF_DATA_TYPE_UNDEFINED:
    case this.AMF_DATA_TYPE_UNSUPPORTED:
    break;
    case this.AMF_DATA_TYPE_MIXEDARRAY:
      // skip 32bit max array len
      stream.skip(4);
      while (stream.available() > 2) {
        key = this.get_amf_string(stream);
        this.parse_amf_object(stream, depth + 1, key);
      }
    break;
    case this.AMF_DATA_TYPE_ARRAY:
      // not really implemented.
      var array_len = stream.getUint32();
      alert("array of length " + array_len);
      for (i = 0; i < array_len; i++) {
        this.parse_amf_object(stream, depth + 1, undefined);
      }
      break;
    case this.AMF_DATA_TYPE_DATE:
      stream.skip(8 + 2); // skip, double (8) + offset (int16)
    break;
    case this.AMF_DATA_TYPE_OBJECT_END:
    case this.AMF_DATA_TYPE_LONG_STRING:
    case this.AMF_DATA_TYPE_REFERENCE:
    //unsupported.
    break;
  };

  if (depth == 1 && key) {
    if (key == "duration") {
      this.metadata.duration = num_val * this.AV_TIME_BASE;
    } else if (key == "videodatarate" && num_val > 0) {
      this.metadata.videodatarate = num_val * 1024.0;
    } else if (key == "audiodatarate" && num_val > 0) {
      this.metadata.audiodatarate = num_val * 1024.0;
    } else if (key == "datastream") {
      this.stream.data = [];
    } else if (this.trust_metadata == true) {
      if (key == "videocodecid" && this.streams.video.length > 0) {
        this.metadata.audiocodecid = num_val;
      } else if (key == "audiocodecid" && this.streams.audio.length > 0) {
        this.metadata.audiocodecid = num_val;
      } else if (key == "audiosamplerate" && this.streams.audio.length > 0) {
        this.metadata.samplerate = num_val;
      } else if (key == "width" && this.streams.video.length > 0) {
        this.metadata.width = num_val;
      } else if (key == "height" && this.streams.video.length > 0) {
        this.metadata.height = num_val;
      } else {
        // assume it's a number. this is ridiculously bad.
        this.metadata[key] = num_val;
      }
    }
  }
}

/**
 * Read the metadata.
 *
 * Layout:
 * - An AMF string, that should be "onMetaData"
 * - An AMF object
 */
FlvFile.prototype.read_metabody = function(err, data) {
  if (err) { alert("Error ! "); return; }
  Util.add_trace("read_metabody.");
  var stream = new BinaryStream(data);

  var type = stream.getUint8();
  Util.assert(type == this.AMF_DATA_TYPE_STRING, "We should find a string.");

  var len = stream.getUint16();

  Util.assert(len == 10, "Length on onMetaData should be 10");

  // We want to find the "onMetaData" string.
  var str = stream.getCharArray(len);
  Util.assert(type == this.AMF_DATA_TYPE_STRING && str == "onMetaData",
              "Found correct things at the beginning of a metadata packet.");

  this.parse_amf_object(stream, 0);
  this.offset += stream.parsedBytes();
  Util.assert(this.offset == this.next, "We should have parsed all the data: " + this.offset + " == " + this.next);

  // notify that we have metadata
  this.data_callback("metadata", this.metadata);

  Util.get(this.blob, "binary", this.offset, this.offset + 32, this.parse_packet.bind(this));
}

/**
 * Parse a packet. This is the hard part. Kind of.
 *
 * The layout is explained inline.
 */
FlvFile.prototype.parse_packet = function(err, data) {
  Util.add_trace("###### parse_packet. offset is " + this.offset);
  if (err) { alert("Error ! "); return; }
  stream = new BinaryStream(data);

  // First, the _last_ packet size (uint32) repeated at the end. We don't care
  // about that.
  var previous = stream.getUint32();
  Util.add_trace("previous packet size: " + previous);
  this.offset+=4;

  // If we have no data here, we reached EOF.
  if (stream.available() == 0) {
    this.data_callback("eof", undefined);
    return;
  }

  // uint8, packet type.
  var packet_type = stream.getUint8();
  this.offset++;
  Util.add_trace("packet type: " + packet_type);

  // uint24, packet size.
  var packet_size = stream.getUint24();
  this.offset+=3;
  Util.add_trace("packet size: " + packet_size);

  // 32 bits, decoding timestamp
  var dts = stream.getUint24() |
            stream.getUint8() << 24;
  this.offset += 4;
  Util.add_trace("decoding timestamp: " + dts);

  // uint24, stream id. we don't care about that.
  stream.skip(3);
  this.offset += 3;

  // This is dead code to validate the time stamp
  //var fs = this.flv_state;
  //if (fs.validate_next < fs.validate_count) {
    //var validate_pos = fs.validate_index[fs.validate_next].pos;
    //if (this.offset == validate_pos) {
      //if (Math.abs(dts - fs.validate_index[fs.validate_next].dts) <= VALIDATE_INDEX_TS_THRESH) {
        //fs.validate_next++;
      //} else {
        //// clear_index_entries ?
        //fs.validate_count = 0;
      //}
    //} else if (offset > validate_pos) {
      //// clear_index_entries
      //fs.validate_count = 0;
    //}
  //}

  // Next packet offset.
  this.next = packet_size + this.offset;

  var stream_type,
      flags,
      skip = false;
  if (packet_type == this.FLV_TAG_TYPE_AUDIO) {
    Util.add_trace("Found an audio packet.");
    stream_type = this.FLV_STREAM_TYPE_AUDIO;
    // uint8: flags (will be used to get info in a bit)
    flags = stream.getUint8();
    this.offset++;
    packet_size--;
  } else if(packet_type == this.FLV_TAG_TYPE_VIDEO) {
    Util.add_trace("Found a video packet");
    stream_type = this.FLV_STREAM_TYPE_VIDEO;
    // uint8: flags (will be used to get info in a bit)
    flags = stream.getUint8();
    this.offset++;
    packet_size--;

    if ((flags & this.FLV_VIDEO_FRAMETYPE_MASK) == this.FLV_FRAME_VIDEO_INFO_CMD) {
      Util.add_trace("Found a video packet that we want to skip.");
      skip = true;
    }
  } else if (packet_type == this.FLV_TAG_TYPE_META) {
    if (packet_size > 13 + 1 + 4 && dts == 0) {
      Util.add_trace("Found a metadata packet." + this.offset + " " + this.next);
      Util.get(this.blob, "binary", this.offset, this.next, this.read_metabody.bind(this));
      return;
    } else if (dts != 0) {
      Util.add_trace("Found a script metadata packet.");
      stream_type = this.FLV_STREAM_TYPE_DATA;
    } else {
      Util.add_trace("Found a bizarre packet. Skip it.");
      skip = true;
    }
  }

  // This is used to recover if we find something we don't like. We go directly
  // to the next packet.
  if (skip) {
    Util.add_trace("Skipping " + this.offset + " to " + this.next);
    Util.get(this.blob, "binary", this.offset, this.next, this.parse_packet.bind(this));
    return;
  }

  // TODO Seek to the end and substract timestamps if we don't have a duration.

  // Find the codec for this packet.
  if (stream_type == this.FLV_STREAM_TYPE_AUDIO) {
    this.current_stream = this.streams.audio[0];

    var channels = ((flags & this.FLV_AUDIO_CHANNEL_MASK) == this.FLV_STEREO)
                   ? 2 : 1;
    Util.add_trace("Found " + channels + " channels");
    // Find info about this packet using masking on the flag.
    var sample_rate = 41000 <<
                      ((flags & this.FLV_AUDIO_SAMPLERATE_MASK) >>
                       this.FLV_AUDIO_SAMPLERATE_OFFSET >> 3);
    Util.add_trace("Found samplerate of " + sample_rate);
    var bits_per_coded_samples = (flags & this.FLV_AUDIO_SAMPLESIZE_MASK) ?
                                 16 : 8;
    Util.add_trace("Found " + bits_per_coded_samples + " bits by sample");

    // if we did not have infos for this stream, set them now.
    if (!this.streams.audio[0].channels &&
        !this.streams.audio[0].sample_rate &&
        !this.streams.audio[0].bits_per_coded_samples) {
      this.streams.audio[0].channels = channels
      this.streams.audio[0].sample_rate = sample_rate;
      this.streams.audio[0].bits_per_coded_samples = bits_per_coded_samples;
    }
    if (!this.streams.audio[0].codec) {
      if (( flags & this.FLV_AUDIO_CODECID_MASK ) != this.FLV_CODECID_AAC) {
        this.error_callback("The audio codec in this file"+
                            "is not AAC. Not supported.");
        return;
      }
      this.streams.audio[0].codec = "aac";
      Util.add_trace("Found an aac packet.");
    }
  } else if (stream_type == this.FLV_STREAM_TYPE_VIDEO) {
    this.current_stream = this.streams.video[0];
    if ((flags & this.FLV_VIDEO_CODECID_MASK) != this.FLV_CODECID_H264) {
      this.error_callback("The audio codec in this file"+
                          "is not h264. Not supported.");
      return;
    } else {
      this.streams.video[0].codec = "h264";
      Util.add_trace("Found an h264 packet.");
    }
  }

  // assuming we have h264 || aac
  // uint8: Get the aac or h264 packet type.
  var type = stream.getUint8();
  packet_size--;
  this.offset++;
  if (this.current_stream.codec == "h264") {
    var cts = (stream.getUint24() + 0xff800000) ^ 0xff800000;
    packet_size -= 3;
    this.offset += 3;
    pts = dts + cts;
    if (cts < 0) {
      this.wrong_dts = 1;
      Util.add_trace("negative cts, previous timestamps might be wrong.");
      // set to invalid dts
      dts = -1;
    }
  Util.add_trace("pres time : " + pts);
  } else {
    pts = undefined;
  }
  // The first aac and h264 packets have extra data. We store them but don't do
  // something useful with it as per now.
  if (type == 0 && (this.current_stream.extradata == null || this.streams.audio[0].codec === "aac")) {
    this.read_flv_extradata(packet_size);
    return;
  }

  // Actually get the data packet. If we have a presentation time stamp, use it.
  // Otherwise, use the decoding time stamp.
  var packet = {pts: pts ? pts : dts};
  this.read_and_send_packet(packet, packet_size, stream_type);
}

/**
 * Read data from the bitstream as extradata. This is stored, but we don't do
 * anything with it.
 *
 * Then, if we have extradata, there is nothing else in the packet, so we go on
 * with the next packet.
 */
FlvFile.prototype.read_flv_extradata = function(size) {
  Util.add_trace("Reading acc extradata: " + size);
  var _this = this;
  Util.get(this.blob, "binary", this.offset, this.offset + size, function(err, data) {
    if (err) { alert("Error ! "); return; }
    _this.current_stream.extradata = new Uint8Array(data);
    _this.offset += size;
    Util.get(_this.blob, "binary", _this.offset, _this.offset + 32, _this.parse_packet.bind(_this));
  });
}

/**
 * The stream is positionned at the beginning of the actual AAC or h264 packet.
 * Read it and call our data callback.
 */
FlvFile.prototype.read_and_send_packet = function(packet, packet_size, stream_type) {
  var _this = this;
  Util.get(this.blob, "binary", this.offset, this.offset + packet_size, function(err, data) {
    if (err) { alert("Error ! "); return; }
    packet.data = data;
    _this.data_callback(_this.stream_type_to_str[stream_type], packet);
    _this.offset += packet_size;
    Util.get(_this.blob, "binary", _this.offset, _this.offset + 32, _this.parse_packet.bind(_this));
  });
}

/**
 * Parse the header of an FLV file.
 *
 * Layout of the bitstream inline.
 */
FlvFile.prototype.parse_header = function(next) {
  var _this = this;
  Util.get(_this.blob, "binary", _this.offset, _this.offset + 32, function(err, data) {
    if (err) { alert("Error ! "); return; }

    stream = new BinaryStream(data);
    var FLV = stream.getUint8Array(3);
    _this.offset += 3;

    // "FLV" ascii string, 3 bytes
    Util.assert(Util.compareArray(FLV, _this.FLV_STRING),
                "First four bytes are " + Util.arrayToString(FLV) );

    // Version, one byte
    var version = stream.getUint8();
    _this.offset += 1;
    Util.assert(version < 5, "Version should be < 5, is " + version);

    // Flags, one byte
    var flags = stream.getUint8();
    _this.offset += 1;
    if (flags === 0) {
      Util.add_trace("The bitstream says that no stream is present.", false);
    }

    _this.hasVideo = flags & _this.FLV_HAS_VIDEO;
    _this.hasAudio = flags & _this.FLV_HAS_AUDIO;
    if (_this.hasAudio) {
      _this.streams.audio.push("audio track.");
      Util.add_trace("We have audio.");
    }
    if (_this.hasVideo) {
      Util.add_trace("We have video.");
      _this.streams.video.push("video track.");
    }

    // Header size, 4 bytes
    var headerSize = stream.getUint32BE();
    _this.offset += 4;
    Util.assert(headerSize > 8, "Header should be big enough, is " + headerSize);

    Util.get(_this.blob, "binary", _this.offset, _this.offset + 32, next.bind(_this));
  });
};

