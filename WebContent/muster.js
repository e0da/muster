/*!
 * Muster v1.8.2
 * http://apps.education.ucsb.edu/redmine/projects/muster
 *
 * Copyright 2011, Justin Force
 * Licensed under the BSD 3-Clause License
 *
 * Includes "Merge Sort in JavaScript"
 */

/*jslint browser: true, indent: 2 */
/*global jQuery */

// Merge Sort

/*!
 * Merge Sort in JavaScript v1.0
 * http://github.com/sidewaysmilk/merge-sort
 *
 * Copyright (c) 2011, Justin Force
 * Licensed under the BSD 3-Clause License
 */

/*jslint browser: true, indent: 2 */
/*global jQuery */

(function () {

  'use strict';

  // Add stable merge sort method to Array prototype
  //
  if (!Array.mergeSort) {
    Array.prototype.mergeSort = function (compare) {

      var length = this.length,
        middle = Math.floor(length / 2);

      // define default comparison function if none is defined
      //
      if (!compare) {
        compare = function (left, right) {
          if (left  <  right) {
            return -1;
          } else if (left === right) {
            return 0;
          } else {
            return 1;
          }
        };
      }

      if (length < 2) {
        return this;
      }

      // merge left and right arrays using comparison function `compare`
      //
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
        this.slice(0, middle).mergeSort(compare),
        this.slice(middle, length).mergeSort(compare),
        compare
      );
    };
  }

  // Add merge sort to jQuery if it's present
  //
  if (window.jQuery !== undefined) {
    jQuery.fn.mergeSort = function (compare) {
      return jQuery(Array.prototype.mergeSort.call(this, compare));
    };
    jQuery.mergeSort = function (array, compare) {
      return Array.prototype.mergeSort.call(array, compare);
    };
  }

}());


// Muster
//
(function (context, $) {

  'use strict'; // strict ECMAScript interpretation



  // Constants
  //
  var POSSIBLE_PARAMETERS = [ 'database', 'select', 'from', 'where', 'order' ],
    DEFAULT_URL = 'https://apps.education.ucsb.edu/muster/';

  ///////////////////////////////////////////////////////////////////////////////
  // Constructors and utility functions. Utility functions are specifically meant
  // NOT to be methods of the Muster object.
  ///////////////////////////////////////////////////////////////////////////////

  /*
   * Return true if obj is a String
   */
  function isString(obj) {

    // XXX We use both typeof and instance of to cover this weird bug
    // in IE and Safari where reloading the page makes these things
    // Strings instead of 'string's. O_o
    //
    // http://stackoverflow.com/a/8220468/234242
    //
    return (typeof obj === 'string' || obj instanceof String);
  }


  /*
   * Constructor
   */
  function Muster(args) {

    if (isString(args)) {
      this.database = args;
    } else if (args !== undefined) {
      this.url = args.url;
      this.database = args.database;
    }

    if (this.url === undefined) {
      this.url = DEFAULT_URL;
    }
  }

  /*
   * Constructor wrapper.
   *
   * Whether called as a function or a constructor, it always returns an
   * instance of Muster, i.e. `Muster` and `new Muster()` are equivalent.
   */
  function constructorWrapper(args) {
    return new Muster(args);
  }

  /*
   * Assemble the request URI
   */
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
        th = $(event.target),             // the heading that was clicked
        table = th.closest('table'),
        tbody = table.find('tbody'),
        index = th.index() + 1,           // the numerical position of the clicked heading
        rows = table.find('tbody tr'),
        sorted = th.hasClass('sorted'),   // is the column already sorted?
        rsorted = th.hasClass('rsorted'); // is the column already reverse sorted?

      // Remove sort statuses from all other headings
      //
      th.siblings().removeClass('sorted').removeClass('rsorted');

      // If it's already sorted, the quickest solution is to just reverse it.
      // Otherwise, do a stable merge sort of the unsorted column and mark it
      // as sorted.
      //
      if (sorted || rsorted) {
        th.toggleClass('sorted').toggleClass('rsorted');
        sortedRows = Array.prototype.reverse.apply(rows);
      } else {
        sortedRows = rows.mergeSort(function (left, right) {

          // compare the text of each cell, case insensitive
          //
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
  //
  context.muster = constructorWrapper;



  ///////////////////////////////////////////////////////////////////////////////
  // Muster's prototype
  // All public methods are defined here.
  ///////////////////////////////////////////////////////////////////////////////
  //
  Muster.prototype = {

    query: function (query, callback) {
      var muster = this;
      $.getJSON(getRequestUri(this.url, this.database, query), function (data) {
        muster.columns = data.columns;
        muster.results = data.results;
        callback.apply(muster);
      });
    },

    // Return true if there are no results
    //
    isEmpty: function () {
      return this.results.length < 1;
    },

    // Return a new copy of this Muster
    //
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

    /*
     * Return a copy of this Muster containing only the results for which
     * `filterFunction` returns true.
     *
     * In `filterFunction`, `this` refers to the current row, so to return all
     * of the results for which the first_name field starts with "R", you might
     * do
     *
     *    myResults.filter(function () {
     *      return this.first_name.indexOf('R') === 0;
     *    });
     */
    filter: function (filterFunction) {

      var clone = this.clone();

      clone.results = $.grep(this.results, function (row) {
        return filterFunction.call(row);
      });

      return clone;
    },

    /*
     * Return an array of Musters where each row shares the same value for the
     * `column` passed in.
     *
     * e.g. if your current Muster.results looked like 
     *
     *   myResults = [
     *     {id: 7, name: 'Bob'},
     *     {id: 7, name: 'Sue'},
     *     {id: 9, name: 'Fred'},
     *     {id: 9, name: 'Bob'},
     *   ];
     *
     * then `myResults.groupBy('id');` would yield
     *
     *   [
     *     [
     *       {id: 7, name: 'Bob'},
     *       {id: 7, name: 'Sue'}
     *     ],
     *     [
     *       {id: 9, name: 'Fred'},
     *       {id: 9, name: 'Bob'}
     *     ]
     *   ]
     */
    groupBy: function (column) {

      var ret = [],
        uniq = [],
        muster = this;

      // If we have not encountered this value before, we record its occurrence
      // and create a Muster clone, then set its results to an empty array. If
      // we have seen this value before, we simply push it into the array
      //
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

    /*
     * Return a modified Muster which joins together similar rows based on
     * `uniqueColumn` (usually something like "id"). Columns with multiple
     * values become nested.
     * 
     * Say we have a Muster that looks like this:
     *
     *   myMuster.results = [
     *     { "id": "2", "friend": "Bob",   "pubtitle": "Jump Up",       "pubyear": "2006" },
     *     { "id": "2", "friend": "Bob",   "pubtitle": "Sit Down",      "pubyear": "2008" },
     *     { "id": "2", "friend": "Bob",   "pubtitle": "Backflips",     "pubyear": "2008" },
     *     { "id": "2", "friend": "Doug",  "pubtitle": "Fly Fishing",   "pubyear": "2010" },
     *     { "id": "3", "friend": "Sue",   "pubtitle": "Old Times",     "pubyear": "2009" },
     *     { "id": "3", "friend": "Sue",   "pubtitle": "Rocking Horse", "pubyear": "2009" },
     *     { "id": "3", "friend": "Daisy", "pubtitle": "Bolts",         "pubyear": "2009" },
     *     { "id": "3", "friend": "Daisy", "pubtitle": "Coffee Fancy",  "pubyear": "2003" }
     *   ]
     *
     * Calling `myMuster.serializeBy('id');` gives us a myMuster.results that looks like
     *
     *   [
     *     {
     *       "id": "2",
     *       "friend":   [ "Bob", "Doug" ],
     *       "pubtitle": [ "Jump Up", "Sit Down", "Backflips", "Fly Fishing" ],
     *       "pubyear":  [ "2006", "2008", "2010" ],
     *     },
     *     {
     *       "id": "3",
     *       "friend":   [ "Sue", "Daisy" ],
     *       "pubtitle": [ "Old Times", "Rocking Horse", "Bolts", "Coffee Fancy" ],
     *       "pubyear":  [ "2009", "2003" ],
     *     }
     *   ];
     *
     * But that's not quite right. Some of the pubyears got lost and can't be
     * properly associated with the pubtitles. So, optionally, specify a set of
     * `customProperties` as an array of objects of the form:
     *
     *   myMuster.serializeBy('id', [
     *     { "publication": {"title": "pubtitle", "year": "pubyear" },
     *   ]);
     *
     * When your serialized Muster is created, myMuster.results will be
     * slightly more complex having nested properties.
     *
     *   [
     *     {
     *       "id": "2",
     *       "friend": [ "Bob", "Doug" ],
     *       "pubtitle": [ "Jump Up", "Sit Down", "Backflips", "Fly Fishing" ],
     *       "pubyear": [ "2006", "2008", "2010" ],
     *       "publication": [
     *         { "title": "Jump Up",     "year": "2006" },
     *         { "title": "Sit Down",    "year": "2008" },
     *         { "title": "Backflips",   "year": "2008" },
     *         { "title": "Fly Fishing", "year": "2010" },
     *       ]
     *     },
     *     {
     *       "id": "3",
     *       "friend":   [ "Sue", "Daisy" ],
     *       "pubtitle": [ "Old Times", "Rocking Horse", "Bolts", "Coffee Fancy" ],
     *       "pubyear":  [ "2009", "2003" ],
     *       "publication": [
     *         { "title": "Old Times",     "year": "2009" },
     *         { "title": "Rocking Horse", "year": "2009" },
     *         { "title": "Bolts",         "year": "2009" },
     *         { "title": "Coffee Fancy",  "year": "2003" },
     *       ]
     *     }
     *   ];
     *
     * So the original joined results are maintained in their original fields,
     * but we get an additional field to handle these fields that are related as
     * a unit. You could now find out some information about this person by
     * referencing these fields directly.
     *
     *   myMuster[0].friend; // ["Bob", "Doug"];
     *
     *   myMuster[1].publication[2].title; // "Rocking Horse"
     */
    serializeBy: function (uniqueColumn, customProperties) {

      // Get an array of Musters all grouped by uniqueColumn, then create a
      // clone of this Muster to house our serialized results. Empty the
      // results of the clone. If the clone is empty, return it now (no further
      // processing). 
      //
      var columns,
        grouped = this.groupBy(uniqueColumn),
        clone = this.clone();

      clone.results = [];
      if (grouped.length === 0) {
        return clone;
      }

      columns = grouped[0].columns;

      $.each(grouped, function () {
        var mergedRow = {};

        $.each(this.results, function () {
          var row = this;

          // Process customProperties
          //
          // For each custom property in each row in each group, add the defined
          // attribute with the defined value. See main method documentation
          // (above) for more information.
          //
          if (customProperties) {
            $.each(customProperties, function () {
              var prop, attr, obj;
              for (prop in this) {
                if (this.hasOwnProperty(prop)) {
                  if (columns.indexOf(prop) < 0) {
                    columns.push(prop);
                  }
                  obj = {};
                  for (attr in this[prop]) {
                    if (this[prop].hasOwnProperty(attr)) {
                      obj[attr] = row[this[prop][attr]];
                    }
                  }
                  row[prop] = obj;
                }
              }
            });
          }

          // Set the value for each column. We check for and avoid creating
          // duplicates as we insert (identical values will appear in adjacent
          // cells when it's a join query).
          //
          $.each(columns, function () {

            // return true if a is equivalent to b. must both be strings or
            // both be objects.
            //
            function equal(a, b) {
              var p;
              if (!a || !b) {
                return false;
              }
              if (isString(a) && isString(b)) {
                return a === b;
              } else {
                for (p in a) {
                  if (a.hasOwnProperty(p) && a[p] !== b[p]) {
                    return false;
                  }
                }
              }
              return true;
            }

            // true if the value of row[col] already exists in mergedRow[col].
            // Need a function because it's possible for mergedRow[col] to
            // contain a string, an object, or an array of strings or objects.
            //
            function alreadyExistsAt(col) {
              var exists = false;
              if (mergedRow[col] instanceof Array) {
                $.each(mergedRow[col], function () {
                  if (equal(this, row[col])) {
                    exists = true;
                  }
                });
              } else {
                if (equal(mergedRow[col], row[col])) {
                  return true;
                }
              }
              return exists;
            }

            // true if the object for the new row is empty (all fields are
            // undefined)
            //
            function empty(obj) {
              var p;
              if (isString(obj)) {
                return false;
              }
              for (p in obj) {
                if (obj.hasOwnProperty(p)) {
                  if (obj[p]) {
                    return false;
                  }
                }
              }
              return true;
            }

            // - If the new value is an empty object (its attributes are all
            //   undefined), ignore it.
            //
            // - If the new value already exists in the merged cell, ignore it.
            //
            // - If the merged cell isn't set, simply set it to the new value.
            //
            // - If the merged cell contains an array, simply push the new value
            //   onto the array
            //
            // - If the merged cell is set and is not an array, set the merged cell
            //   to an array containing both values
            // 
            if (empty(row[this])) {
              return;
            } else if (alreadyExistsAt(this)) {
              return;
            } else if (mergedRow[this] === undefined) {
              mergedRow[this] = row[this];
            } else if (mergedRow[this] instanceof Array) {
              mergedRow[this].push(row[this]);
            } else {
              if (mergedRow[this] !== row[this]) {
                mergedRow[this] = [mergedRow[this], row[this]];
              }
            }
          });
        });
        clone.results.push(mergedRow);
      });

      return clone;
    },

    // Legacy support for old syntax
    //
    serializeJoinedResults: function (uniqueColumn) {
      return this.serializeBy(uniqueColumn);
    },

    /*
     * Return a jQuery object containing a table.
     *
     * `columnSpec` defines the columns and their content. If columnSpec is
     * undefined or null, all available columns are rendered in the default way
     * with cells containing multiple values rendering those values in an
     * unordered list.
     *
     * `columnSpec` is an array of strings or 2-element arrays defining the
     * columns to display. For each columnSpec element,
     *
     *   - If the element is a String, it will be interpretted as the literal
     *     column label that is passed to Muster in the query, and this String
     *     will also be used as the table heading for that column.
     *   - If the element is a 2-element array, the first element of the array
     *     must be a String and will be used as the table heading for the
     *     column. The second element of the array may be a String or a
     *     function.
     *     - If the second element is a String, the String must map the the
     *       column in Muster that was defined in the query. For example,
     *       perhaps the database uses the word 'title' but you want 'Book
     *       Title':
     *
     *         [ 'Book Title', 'title' ]
     *
     *       - If the second element is a function, the function returns the
     *         value used in each cell, calculated per row (the context of the
     *         function has `this` referring to the current row). For example,
     *         if your Muster object has first_name and last_name fields, you
     *         might define
     *
     *           [ 'Full Name', function () { return this.first_name + ' ' + this.last_name; } ]
     *
     * All together now! Say you have the previously mentioned title and name
     * fields as well as a Position field, you would define them in order:
     *
     *   [
     *     'Position',
     *     [ 'Full Name', function () { return this.first_name + ' ' + this.last_name; } ],
     *     [ 'Book Title', 'title' ]
     *   ]
     *
     *
     *
     * `parent` is an optional argument defining a jQuery selector or jQuery
     * object to which the table will be appended after it is rendered the after
     * the $(document).ready event has fired.
     *
     *
     *
     * `callback` is an optional function which is called after the table is rendered.
     *
     * N.B. `callback` does not itself check to see that $(document).ready has
     *      fired, so any code that is dependent on the rendered table should be
     *      wrapped in $(). You do, however, have access to the table itself as that
     *      is stored in memory and manipulable even prior to being rendered.
     */
    toTable: function (columnSpec, parent, callback) {

      var columns, columnLabels,
        table = $('<table><thead><tr></tr></thead><tbody></tbody></table>'),
        thead = table.find('thead tr'),
        tbody = table.find('tbody');

      if (!columnSpec) {
        columns = columnLabels = this.columns;
      } else {
        columns = [];
        columnLabels = [];

        // If it's an array, the first element defines the label and the second
        // the column value. If it's a string, we use the same for both.
        //
        // XXX we need the toString method here because of bugs in Safari and
        // IE which cause typeof and instanceof to behave strangely with
        // regards to Strings. See isString() method for more information.
        //
        $.each(columnSpec, function () {
          if (this instanceof Array) {
            columnLabels.push(this[0]);
            columns.push(this[1]);
          } else if (isString(this)) {
            columns.push(this.toString());
            columnLabels.push(this.toString());
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
            //
            value = this.apply(row);

          } else if (row[this] instanceof Array) {

            // multiple values
            //
            value = row[this].join('</li><li>');
            value = '<ul><li>' + value + '</li></ul>';

          } else {

            // just a string
            //
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
  //
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

