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
  },

  isEmpty: function() {
    return this.results.length < 1;
  },

  filter: function(column, value) {
    var column = arguments[0];
    var value = arguments[1];
    var filteredResults = $.grep(this.results, function(row, i) {
      return row[column] == value;
    });
    var clone = this.clone();
    clone.results = filteredResults;
    return clone;
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

  groupBy: function(column) {

    // ret is an array of arrays. Each array in ret shares the same value for
    // row[column]. uniq keeps track of whether we've encountered a value
    // before so we only traverse the results once.
    var ret = [],
        uniq = [],
        muster = this;

    $.each(this.results, function(k, row) {
      var i = uniq.indexOf(row[column]);
      if (i < 0) {
        uniq.push(row[column]);
        i = uniq.length - 1;
        ret[i] = muster.clone();
        ret[i].results = [];
      }
      ret[i].results.push(row);
    });
    return ret;
  },

  //TODO comment this and maybe refactor
  serializeJoinedResults: function(uniqueColumn) {
    var results = [];
    var m = this; // for use in inner functions
    var grouped = m.groupBy(uniqueColumn);
    var columns = grouped[0].columns;
    columns.splice(grouped[0].columns.indexOf(uniqueColumn), 1);
    $.each(grouped, function(k, group) {
      var mergedRow = {};
      $.each(group.results, function(k, row) {
        $.each(columns, function(k, column) {
          if (mergedRow[column] == undefined) {
            mergedRow[column] = row[column];
          }
          else if (typeof mergedRow[column] == 'string') {
            if (mergedRow[column] != row[column]) {
              var val = mergedRow[column];
              mergedRow[column] = [row[column]];
            }
          }
          else {
            mergedRow[column].push(row[column]);
          }
        });
      });
      results.push(mergedRow);
    });
    var clone = this.clone();
    clone.results = results;
    return clone;
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

