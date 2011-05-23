function muster(options) {

  /* TODO handle failed JSON requests */

  var $muster = this;

  var url = options.url;
  var database = options.database;
  var results;

  /* construct and execute the query */

  /* parameters which may be passed to Muster servlet */
  var parameters = ['select', 'from', 'where', 'order'];

  this.query = function(options) {

    /* paramaterized JSONP request URI */
    var uri = url + '?database=' + escape(database);
    
    $.each(parameters, function() {
      console.log(this, options[this]);
      if (options[this] != null && options[this].length > 0) {
        uri += '&' + this + '=' + options[this];
      }
    });

    /* append jQuery callback */
    uri += '&callback=?';

    console.log(uri);

    $.getJSON(uri, function(data) {
      results = data;
      options.callback(results);
    });

    return results;
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

  return $muster;
};

