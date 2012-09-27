var Profile = {
  // Beginning of a batch parse (ms since epoch).
  begin : null,
  // End of a batch parse (ms since epoch).
  end : null,
  // Number of file parsed to compute average.
  total : 0,
  count : 0
};

// A path → blob hash.
var tracks = {};
// Prefix of all the files to be fetched.
var prefix = "media/";

var print_metadata = true;

// This is to be replaced by a proper access method.
var MediaFetcher = {
  // A path → ogg file info hash.
  media : {},
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
  display_table : function(table, key, value) {
    var tr = document.createElement('tr');
    var td_label = document.createElement('td');
    var td_value = document.createElement('td');
    td_label.innerHTML = key;
    td_value.innerHTML = value;
    table.appendChild(tr);
    tr.appendChild(td_label);
    tr.appendChild(td_value);
  },
  handle_file : function (blob, url, options) {
    var _this = this;
    var flvfile = new FlvFile(blob, function(type, data) {
      var packets_list = document.querySelector(".packets"),
                         line = document.createElement("li");

      switch (type) {
        case "audio":
        case "video":
          line.innerHTML = "[" + type + "] " + "[pts:" + data.pts + "]" + "(size: " + data.data.byteLength + ")"
          break;
        case "metadata":
          line.innerHTML = "<pre>" + JSON.stringify(data, null, "\t") + "</pre>";
          break;
        case "eof":
          line.innerHTML = "EOF";
          break;
      }

      packets_list.appendChild(line);

    }, function(str) {
      alert("Error:" + str);
    });

    _this.media[url] = flvfile;
    flvfile.parse();
  },

 /**
  * Get all the files, supposed to be <li> tags in the page.
*/
  list_files : function() {
    var f = Array.prototype.slice.call(document.querySelectorAll('li'));
    var _this = this;
    f.forEach(function(e) {
      _this.fetch_media(e.innerHTML);
    });
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
