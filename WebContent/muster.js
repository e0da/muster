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

  toTable: function(columnSpec) {

    var columns, columnLabels;

    if (!columnSpec) {
      columns = columnLabels = this.columns;
    }
    else {
      columns = [], columnLabels = [];
      $.each(columnSpec, function(key, column) {
        columns.push(column[0]);
        columnLabels.push(column[1]);
      });
    }

    var table = $('<table><thead><tr></tr></thead><tbody></tbody></table>');
    var thead = table.find('thead tr');
    var tbody = $('<tbody>');

    $.each(columnLabels, function(k, columnLabel) {
      thead.append('<th>' + columnLabel);
    });

    $.each(this.results, function(k, row) {
      var tr = $('<tr>');
      table.append(tr);
      $.each(columns, function(k, column) {
        var text;

        // formatting function
        if (typeof column == 'function') {
          text = column.apply(row);
        }
        // multiple values
        else if (row[column] instanceof Array) {
          text = row[column].join('</li><li>');
          text = '<ul><li>' + text + '</li></ul>';
        }
        // just a string
        else {
          text = row[column];
        }
        tr.append('<td>' + text);
      });
    });
    return sortablize(table);
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

// return a stable sortable version of the table
function sortablize(table) {
  table.find('th').css({cursor: 'pointer'}).click(function(event) {
    var th = $(event.target);
    var table = th.closest('table');
    var tbody = table.find('tbody');
    var index = th.index() + 1;
    var rows = table.find('tbody tr');
    tbody.append(rows.msort(function(left, right) {

      left  =  $(left).find('td:nth-child(' + index + ')').text().toLowerCase();
      right = $(right).find('td:nth-child(' + index + ')').text().toLowerCase();

      if      (left < right)  return -1;
      else if (left == right) return 0;
      else                    return 1;
    }));
  });
  return table;
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

// Add stable merge sort to Array and jQuery prototypes
(function() {

  Array.prototype.msort = jQuery.fn.msort = msort;

  function msort(compare) {

    var length = this.length,
        middle = Math.floor(length / 2);

    if (!compare) {
      compare = function() {
        return arguments[0] - arguments[1];
      };
    }

    if (length < 2) {
      return this;
    }

    return merge(
      this.slice(0, middle).msort(compare),
      this.slice(middle, length).msort(compare),
      compare
    );
  }

  function merge(left, right, compare) {

    var result = [];

    while (left.length > 0 || right.length > 0) {
      if (left.length > 0 && right.length > 0) {
        if (compare(left[0], right[0]) <= 0) {
          result.push(left[0]);
          left = left.slice(1);
        }
        else {
          result.push(right[0]);
          right = right.slice(1);
        }
      }
      else if (left.length > 0) {
        result.push(left[0]);
        left = left.slice(1);
      }
      else if (right.length > 0) {
        result.push(right[0]);
        right = right.slice(1);
      }
    }
    return result;
  }
})();

})(window, jQuery);

