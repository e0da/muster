/*!
* Muster v1.0
* http://apps.education.ucsb.edu/redmine/projects/muster
*
* Copyright 2011, Justin Force
* Licensed under the BSD 3-Clause License
*/

/*jslint browser: true, indent: 2 */
/*global jQuery */

(function (context, $) {

  'use strict'; // strict ECMAScript interpretation


  var MergeSort, // object to privide merge sort for Array and jQuery

    // Constants
    POSSIBLE_PARAMETERS = [ 'database', 'select', 'from', 'where', 'order' ],
    DEFAULT_URL = 'https://apps.education.ucsb.edu/muster/';

  /* Add stable merge sort to Array and jQuery prototypes
  *
  * N.B. It may seem unnecessary to define this with a constructor and a
  *      prototype, but for compliance and clarity with 'use strict', we
  *      should.  With 'use strict', `this` will NOT default to pointing to the
  *      base object (window), so we explicitly say that it's a pointer to its
  *      function's parent object by defining a constructor and prototype.
  */
  MergeSort = function () {};
  MergeSort.prototype = {

    msort: function (compare) {

      var length = this.length,
        middle = Math.floor(length / 2);

      if (compare === undefined) {
        compare = function (left, right) {
          if (left < right) {
            return -1;
          }
          if (left === right) {
            return 0;
          } else {
            return 1;
          }
        };
      }

      if (length < 2) {
        return this;
      }

      function merge(left, right, compare) {

        var result = [];

        while (left.length > 0 || right.length > 0) {
          if (left.length > 0 && right.length > 0) {
            if (compare(left[0], right[0]) <= 0) {
              result.push(left[0]);
              left = left.slice(1);
            } else {
              result.push(right[0]);
              right = right.slice(1);
            }
          } else if (left.length > 0) {
            result.push(left[0]);
            left = left.slice(1);
          } else if (right.length > 0) {
            result.push(right[0]);
            right = right.slice(1);
          }
        }
        return result;
      }

      return merge(
        this.slice(0, middle).msort(compare),
        this.slice(middle, length).msort(compare),
        compare
      );
    }
  };
  Array.prototype.msort = jQuery.fn.msort = MergeSort.prototype.msort;



  ///////////////////////////////////////////////////////////////////////////////
  // Constructors and utility functions. Utility functions are specifically meant
  // NOT to be methods of the Muster object.
  ///////////////////////////////////////////////////////////////////////////////

  // Constructor
  function Muster(args) {

    if (typeof args === 'string') {
      this.database = args;
    } else if (args !== undefined) {
      this.url = args.url;
      this.database = args.database;
    }

    if (this.url === undefined) {
      this.url = DEFAULT_URL;
    }
  }

  // Constructor wrapper.
  // Whether called as a function or a constructor, it always returns an instance
  // of Muster, i.e. `Muster` and `new Muster()` are equivalent.
  function constructorWrapper(args) {
    return new Muster(args);
  }

  // Assemble the request URI
  function getRequestUri(url, database, params) {

    // each value is [ 'key', 'value' ] and will become 'key=value'
    var parameterPairs = [];

    // Add database to parameters
    params.database = database;

    // assemble the parameters
    $.each(POSSIBLE_PARAMETERS, function () {
      if (params[this] !== undefined && params[this].length > 0) {
        parameterPairs.push([this, window.escape(params[this])].join('='));
      }
    });
    parameterPairs.push('callback=?'); // jQuery JSONP support

    return [url, '?', parameterPairs.join('&')].join('');
  }

  /* Return a copy of the table which supports stable sorting when the table's
  * column headings are clicked.
  *
  * Triggers the $(window).bind('muster_sorted') event after sorting.
  *
  * N.B. If table contents are modified after the table is sorted, sorting and
  *      reverse sorting by clicking the same heading multiple times WILL NOT
  *      correctly sort based on the new content. Sorting again by the same
  *      column just reverses the rows. This has the dual benefits of being
  *      efficient and maintaining a stable sort. If, in the future, Muster
  *      needs to handle sorting a table after data has been modified
  *      dynamically, all of the headings should be stripped of their 'sort'
  *      and 'rsort' classes (i.e.
  *      th.removeClass('sorted').removeClass('rsorted')) BEFORE sorting is
  *      performed to ensure a new sort is performed and that the order isn't
  *      simply reversed.
  */
  function getSortableTable(table) {
    table.find('th').css({cursor: 'pointer'}).click(function (event) {

      var sortedRows,
        th = $(event.target), // the heading that was clicked
        table = th.closest('table'),
        tbody = table.find('tbody'),
        index = th.index() + 1, // the numerical position of the clicked heading
        rows = table.find('tbody tr'),
        sorted = th.hasClass('sorted'), // is the column already sorted?
        rsorted = th.hasClass('rsorted'); // is the column already reverse sorted?

      // Remove sort statuses from all other headings
      th.siblings().removeClass('sorted').removeClass('rsorted');

      // If it's already sorted, the quickest solution is to just reverse it.
      // Otherwise, do a stable merge sort of the unsorted column and mark it
      // as sorted.
      if (sorted || rsorted) {
        th.toggleClass('sorted').toggleClass('rsorted');
        sortedRows = Array.prototype.reverse.apply(rows);
      } else {
        sortedRows = rows.msort(function (left, right) {

          // compare the text of each cell, case insensitive
          left  =  $(left).find('td:nth-child(' + index + ')').text().toLowerCase();
          right = $(right).find('td:nth-child(' + index + ')').text().toLowerCase();

          if (left  <  right) {
            return -1;
          } else if (left === right) {
            return 0;
          } else {
            return 1;
          }
        });

        th.toggleClass('sorted');
      }

      tbody.append(sortedRows);

      $(window).trigger('muster_sorted');

    });
    return table;
  }

  // Expose Muster constructor as method of 'context' (i.e. window.Muster). It's
  // not capitalized because it's a method of 'context' that returns an instance
  // of Muster. The Muster constructor should never be called directly.
  context.muster = constructorWrapper;



  ///////////////////////////////////////////////////////////////////////////////
  // Muster's prototype
  // All public methods are defined here.
  ///////////////////////////////////////////////////////////////////////////////
  Muster.prototype = {

    query: function (query, callback) {
      var muster = this;
      $.getJSON(getRequestUri(this.url, this.database, query), function (data) {
        muster.columns = data.columns;
        muster.results = data.results;
        callback.apply(muster);
      });
    },

    isEmpty: function () {
      return this.results.length < 1;
    },

    clone: function () {

      var property,
        oldMuster = this,
        newMuster = constructorWrapper();

      for (property in oldMuster) {
        if (oldMuster.hasOwnProperty(property)) {
          newMuster[property] = oldMuster[property];
        }
      }
      return newMuster;
    },

    filter: function (column, value) {

      var clone = this.clone();

      clone.results = $.grep(this.results, function (row) {
        return row[column] === value;
      });

      return clone;
    },

    get: function (column) {
      var ret = [];
      $.each(this.results, function () {
        ret.push(this[column]);
      });
      return ret;
    },

    getUnique: function (column) {
      return $.unique(this.get(column));
    },

    getFirst: function (column) {
      return this.results[0][column];
    },

    groupBy: function (column) {

      // ret is an array of arrays. Each array in ret shares the same value for
      // row[column]. uniq keeps track of whether we've encountered a value
      // before so we only traverse the results once.
      var ret = [],
        uniq = [],
        muster = this;

      $.each(this.results, function () {
        var i = uniq.indexOf(this[column]);
        if (i < 0) {
          uniq.push(this[column]);
          i = uniq.length - 1;
          ret[i] = muster.clone();
          ret[i].results = [];
        }
        ret[i].results.push(this);
      });
      return ret;
    },

    /* Return a modified Muster which joins together similar rows based on
    * `uniqueColumn` (usually something like "id"). Columns with multiple
    * values become nested.
    *
    * { "id": 2, "friend": "Bob" }
    * { "id": 2, "friend": "Doug" }
    * { "id": 3, "friend": "Sue" }
    * { "id": 3, "friend": "Daisy" }
    *
    * becomes
    *
    * { "id": 2, "friend": [ "Bob", "Doug" ] }
    * { "id": 3, "friend": [ "Sue", "Daisy" ] }
    */
    serializeJoinedResults: function (uniqueColumn) {

      var grouped = this.groupBy(uniqueColumn),
        columns = grouped[0].columns,
        clone = this.clone();

      clone.results = [];

      /* For each row in each group, examine the values one at a time.
      *
      *   - If the value isn't yet defined in the output, just copy the
      *     incoming value to the output
      *
      *   - If the value in the output is already defined and is a string, it
      *     is a single value. We convert it to an array consisting of the
      *     original value plus the incoming value.
      *
      *   - Otherwise, the output is already an array. Just push the new value
      *     onto it.
      *
      * Once we figure out the row contents, we push it into the clone and
      * return the clone at the end.
      */
      $.each(grouped, function () {
        var mergedRow = {};
        $.each(this.results, function () {
          var row = this;
          $.each(columns, function () {
            if (mergedRow[this] === undefined) {
              mergedRow[this] = row[this];
            } else if (typeof mergedRow[this] === 'string') {
              if (mergedRow[this] !== row[this]) {
                mergedRow[this] = [mergedRow[this], row[this]];
              }
            } else {
              mergedRow[this].push(row[this]);
            }
          });
        });
        clone.results.push(mergedRow);
      });

      return clone;
    },

    toTable: function (columnSpec, parent, callback) {

      var columns, columnLabels,
        table = $('<table><thead><tr></tr></thead><tbody></tbody></table>'),
        thead = table.find('thead tr'),
        tbody = table.find('tbody');

      if (columnSpec === undefined) {
        columns = columnLabels = this.columns;
      } else {
        columns = [];
        columnLabels = [];
        $.each(columnSpec, function () {
          if (this instanceof Array) {
            columns.push(this[0]);
            columnLabels.push(this[1]);
          } else if (typeof this === 'string') {
            columns.push(this);
            columnLabels.push(this);
          }
        });
      }

      $.each(columnLabels, function () {
        thead.append('<th>' + this);
      });

      $.each(this.results, function () {

        var row = this,
          tr = $('<tr>');

        tbody.append(tr);
        $.each(columns, function () {
          var value,
            td = $('<td>');

          if (typeof this === 'function') {

            // formatting function
            value = this.apply(row);

          } else if (row[this] instanceof Array) {

            // multiple values
            value = row[this].join('</li><li>');
            value = '<ul><li>' + value + '</li></ul>';

          } else {

            // just a string
            value = row[this];
          }
          tr.append(td.append(value));
        });
      });

      table = getSortableTable(table);

      if (parent) {
        $($(parent).html(table));
      }

      if (callback) {
        callback.apply(table);
      }

      return table;
    }
  };

  // Add Array.indexOf to browsers that don't have it (i.e. IE)
  (function () {
    if (Array.indexOf === undefined) {
      Array.prototype.indexOf = function (obj) {
        var i, len;
        for (i = 0, len = this.length; i < len; i += 1) {
          if (this[i] === obj) {
            return i;
          }
        }
        return -1;
      };
    }
  }());

}(window, jQuery));

