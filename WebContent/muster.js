(function(context, $) {

// constructor
var Muster = function(args) {
  if (args) {
    this.url = args.url;
    this.database = args.database;
  }
};

// internal use constructor
var init = function(args) {
  return new Muster(args);
};

// expose Muster to context (i.e. window.Muster)
context.Muster = init;

Muster.prototype = {

  query: function(query, callback) {
    var muster = this;
    $.getJSON(getQueryString(this.url, this.database, query), function(data) {
      muster.columns = data.columns;
      muster.results = data.results;
      callback();
    });
    return this;
  },

  filter: function(column, value) {
    var filteredResults = $.grep(this.results, function(row, i) {
      return row[column] == value;
    });
    var c = this.clone();
    c.results = filteredResults;
    return c;
  },

  get: function(column) {
    var ret = [];
    $.each(this.results, function(k, row) {
      ret.push(row[column]);
    });
    return ret;
  },

  getUnique: function(column) {
    return $.unique(this.get(column));
  },

  getFirst: function(column) {
    return this.results[0][column];
  },

  serializeJoinedResults: function(unique) {
    var ret = this.clone();
    //TODO write this
    return ret;
  },

  clone: function() {
    var oldMuster = this;
    var newMuster = init();
    for (attr in oldMuster) {
      newMuster[attr] = oldMuster[attr];
    }
    return newMuster;
  }
};

// Assemble the request URI
function getQueryString(url, database, params) {

  // String concatenation isn't as efficient as join, but we only do this once
  // per query and this is more readable than concatenation acrobatics. -jlf
  var uri = url + '?database=' + escape(database);

  // assemble the parameters
  $.each([
         'database', 'select', 'from', 'where', 'order'
  ], function() {
    if (params[this] != null && params[this].length > 0) {
      uri += '&' + this + '=' + escape(params[this]);
    }
  });
  uri += '&callback=?'
  return uri;
}

})(window, jQuery);

