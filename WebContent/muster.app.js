(function($) {

$(function() {

  var n = $.muster();

  var m = $.muster({
    url: 'http://localhost:8080/muster/',
      database: 'ggsedb'
  });

  var query = {
    select: '*',
    from: 'profile',
    where: 'id is not null'
  };

  m.query(query, function() {
    if (m.hasErrors()) {
      console.log(m.errors);
    }
    var n = m.filter('last_name', 'Koegel').filter('first_name', 'Robert');
    console.log(n.results);
    console.log(m.results);
  });

});

})(jQuery);
