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
    console.log(r);
  })
  
  var n = m.clone();
  n.query(nQuery, function() {
    console.log(n.results.length);
  });



//  m.query(query, function() {
////    var n = m.filter('last_name', 'Koegel').filter('first_name', 'Robert');
////    say(m.get('title'));
////    console.log(n.results);
////    console.log(m.results);
//
//    console.log(m.filter('first_name', 'Robert').filter('interest', 'School improvement'));
//    var n = m.filter('first_name', 'Robert');
//    console.log(n);
//    console.log(n.filter('interest', 'School improvement'));
//    console.log(m.filter('first_name', 'Robert').filter('interest', 'School improvement').getFirst('last_name'));
//    if (m.hasErrors()) {
//      console.log(m.errors);
//    }
//  });
//

// run on ready
//$(function() {
//})();

function say() {
  for (var i = 0, len = arguments.length; i < len; i++) {
    $('body').append('<pre>' + $.trim(arguments[i]) + '</pre>');
  }
}

})(jQuery);
