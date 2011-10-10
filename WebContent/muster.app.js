(function($) {

  Muster({
    url: 'http://harold:8080/muster/',
    database: 'ggsedb'
  }).query({
    select: '*',
    from: 'profile,research_interests',
    where: 'research_interests.profile_id = profile.id'
  }, function() {
    var table = this.serializeJoinedResults('id').toTable([
      ['first_name', 'First Name'],
      ['last_name', 'Last Name'],
      ['title', 'Title'],
      ['interest', 'Research Interests']
    ]);
    $(function() {
      $('body').append(table);
    });
  });

})(jQuery);
