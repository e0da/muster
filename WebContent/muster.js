function muster(options) {

  /* TODO handle failed JSON requests */

  var url = options.url;
  var database = options.database;

  this.query = function(options) {
    return musterQuery(url, database, options);
  }
  return this;
}

function musterQuery(url, database, options) {

  this.results = {};

  /* construct and execute the query */

  /* paramaterized JSONP request URI */
  var uri = url + '?database=' + escape(database);

  /* parameters which may be passed to Muster servlet */
  var parameters = ['select', 'from', 'where', 'order'];

  $.each(parameters, function() {
    if (options[this] != null && options[this].length > 0) {
      uri += '&' + this + '=' + options[this];
    }
  });

  /* append jQuery callback */
  uri += '&callback=?';

  $.getJSON(uri, function(data) {
    results = data;
    results.toTable = function(className) {
      return musterResultsToTable(results, className);
    };
    results.find = function(queries) {
      return musterResultsFind(results, queries);
    }
    if (options.callback) {
      options.callback(results);
    }
    if (options.results) {
      options.results = results;
    }
  });

  return results;
}

function musterResultsToTable(results, className) {
  var className = className ? className : '';
  var table = $('<table>').addClass('musterTable ' + className);

  /* table headers */
  var thead = $('<thead>');
  table.append(thead);
  var headersRow = $('<tr>');
  thead.append(headersRow);
  $.each(results.columns, function() {
    headersRow.append('<th>' + this);
  });

  /* data rows */
  var tbody = $('<tbody>');
  table.append(tbody);
  $.each(results.results, function() {
    var tr = $('<tr>');
    tbody.append(tr);
    $.each(this, function() {
      tr.append('<td>' + this);
    });
  });
  return table;
}

