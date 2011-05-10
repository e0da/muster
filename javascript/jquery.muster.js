jQuery.muster = function(options) {

  var $muster = this;

  console.log(options);

  var url = options.url;
  var database = options.database;
  var results;

  this.query = function(options) {

    console.log(url);

    var query = [
      url,
      '?database=' + escape(database),
      '&select=' + escape(options.select),
      '&from=' + escape(options.from),
      '&where=' + escape(options.where),
      '&callback=?'
    ].join('');

    $.getJSON(query, function(data) {
      results = data;
      options.callback(results);
    });

    return $muster; 
  };

  this.toTable = function(className) {
    var start = Date.now();
    var className = className ? className : '';
    var table = $('<table>').addClass('musterTable ' + className);

    /* table headers */
    var thead = $('<thead>');
    table.append(thead);
    var headersRow = $('<tr>');
    thead.append(headersRow);
    $.each(results.columns, function(key, column) {
      headersRow.append('<th>' + column);
    });

    /* data rows */
    var tbody = $('<tbody>');
    table.append(tbody);
    $.each(results.results, function(key, row) {
      var tr = $('<tr>');
      tbody.append(tr);
      $.each(row, function(key, column) {
        tr.append('<td>' + column);
      });
    });
    console.log(Date.now() - start);
    return table;
  }

  return $muster;
};
