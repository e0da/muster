(function($) {


  var m = Muster({
    url: 'http://harold:8080/muster/',
    database: 'ggsedb'
  });

  var query = {
    select: '*',
    from: 'profile,research_interests',
    where: 'research_interests.profile_id = profile.id'
  };

  var nQuery = {
    select: '*',
    from: 'profile',
    where: ''
  };

  m.query(query, function() {
    var p = m.filter('first_name', 'Lynn Kern');
    var n = m.filter('last_name', 'Koegel');
    var o = n.filter('first_name', 'Robert');
    var q = n.filter('first_name', 'John');

    var r = m.serializeJoinedResults('id');
    doTable(r);
  })
  
  var n = m.clone();
  n.query(nQuery, function() {
    console.log(n.results.length);
  });

function say() {
  for (var i = 0, len = arguments.length; i < len; i++) {
    $('body').append('<pre>' + $.trim(arguments[i]) + '</pre>');
  }
}

//TODO Integrate this into Muster core
function doTable(muster) {
  $(function() {
    var table = $('<table>');
    var thead = $('<thead>');
    var tbody = $('<tbody>');
    table.append(thead).append(tbody);
    $('body').append(table);

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
  });
}

})(jQuery);
