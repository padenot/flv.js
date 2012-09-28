var Profile = {
  // Beginning of a batch parse (ms since epoch).
  begin : null,
  // End of a batch parse (ms since epoch).
  end : null,
  // Number of file parsed to compute average.
  total : 0,
  count : 0
};

// Prefix of all the files to be fetched.
var prefix = "media/";

// This is to be replaced by a proper access method.
var MediaFetcher = {
  // Fetch the media using an xhr, and start to parse the result.
  fetch_media : function(url) {
    var _this = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', prefix + url);
    xhr.responseType = "blob";

    xhr.onload = function() {
      var blob = xhr.response;
      if (blob) {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            _this.handle_file(blob, url);
          }
        }
      }
    };

    xhr.send();
  },
  handle_file : function (blob, url, options) {
    var _this = this;
    var start = Date.now();
    var demuxed_bytes = 0,
        demuxed_bytes_last = 0;
    var speedCounter = setInterval(function() {
      var str = "Speed: " + (Math.round((demuxed_bytes - demuxed_bytes_last) / 1024 * 2)) + " kB per s";
      document.querySelector("#speed").innerHTML = str;
      demuxed_bytes_last = demuxed_bytes;
    }, 500);
    var flvfile = new FlvFile(blob, function(type, data) {
      var packets_list = document.querySelector(".packets"),
                         line = document.createElement("li");

      switch (type) {
        case "audio":
        case "video":
          //line.innerHTML = "[" + type + "] " + "[pts:" + data.pts + "]" + "(size: " + data.data.byteLength + ")"
          demuxed_bytes += data.data.byteLength;
          break;
        case "metadata":
          line.innerHTML = "<pre>" + JSON.stringify(data, null, "\t") + "</pre>";
          break;
        case "eof":
          line.innerHTML = "EOF (time in ms: " + (Date.now() - start) + ")";
          packets_list.appendChild(line);
          clearInterval(speedCounter);
          break;
      }

      //packets_list.appendChild(line);

    }, function(str) {
      alert("Error:" + str);
    });

    flvfile.parse();
  },
  get_file_list : function() {
    var _this = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'filelist.json');

    xhr.onload = function() {
      var text = xhr.responseText;
      if (text) {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            tracks = JSON.parse(text);
            _this.test(tracks);
          }
        }
      }
    };
    xhr.send();
  },
  test : function(tracks) {
    var _this = this;
    var count = 0;
    for(var url in tracks) {
      _this.fetch_media(url);
      count++;
    }
  }
};

function init() {
  MediaFetcher.get_file_list();
}
