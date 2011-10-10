(function($) {

  var muster = Muster({
    url: 'http://harold:8080/muster/',
    database: 'ggsedb'
  });

  var query = {
    select: '*',
    from: 'profile,research_interests',
    where: 'research_interests.profile_id = profile.id'
  };

  muster.query(query, function() {
    doTable(muster.serializeJoinedResults('id'));
  })
  
//TODO Integrate this into Muster core
function doTable(muster) {
  $(function() {
    var table = $('<table>');
    var thead = $('<thead><tr>').find('tr');
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
