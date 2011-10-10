(function(context, $) {

// constructor
var Muster = function(args) {
  if (args) {
    this.url = args.url;
    this.database = args.database;
  }
};

// Constructor wrapper (always return an object; never a function. `new`
// keyword is optional.)
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
      callback.apply(muster);
    });
  },

  isEmpty: function() {
    return this.results.length < 1;
  },

  clone: function() {
    var oldMuster = this;
    var newMuster = init();
    for (attr in oldMuster) {
      newMuster[attr] = oldMuster[attr];
    }
    return newMuster;
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

  // TODO comment this and maybe refactor. Using .groupBy then iterating over
  // the list again is not the most efficient technique possible, but, again,
  // performance vs. readability... It seems pretty fast.
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

  toTable: function(columns) {
    var table = $('<table><thead><tr></tr></thead><tbody></tbody></table>');
    var thead = table.find('thead tr');
    var tbody = $('<tbody>');

    var muster = this; // local pointer for inner functions

    $.each(muster.columns, function(k, column) {
      thead.append('<th>' + column);
    });

    $.each(muster.results, function(k, row) {
      var tr = $('<tr>');
      table.append(tr);
      $.each(muster.columns, function(k, column) {
        var text;
        if (row[column] instanceof Array) {
          text = row[column].join('</li><li>');
          text = '<ul><li>' + text + '</li></ul>';
        }
        else text = row[column];
          tr.append('<td>' + text);
      });
    });
    return table;
  }
};

// Assemble the request URI
function getQueryString(url, database, params) {

  // Add database to parameters
  params['database'] = database;

  // assemble the parameters
  var parameterPairs = [];
  $.each([
         'database', 'select', 'from', 'where', 'order'
  ], function() {
    if (params[this] != null && params[this].length > 0) {
      parameterPairs.push( [this, escape(params[this])].join('=') );
    }
  });
  parameterPairs.push('callback=?'); // jQuery JSONP support

  return [url, '?', parameterPairs.join('&')].join('');
}

// Add Array.indexOf to browsers that don't have it (i.e. IE)
(function() {
  if (!Array.indexOf) {
    Array.prototype.indexOf = function(obj) {
      for (var i = 0, len = this.length; i < len; i++) {
        if (this[i] == obj)
          return i;
      }
      return -1;
    };
  }
})();

})(window, jQuery);

