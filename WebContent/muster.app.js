(function($) {

  Muster({
    url: 'http://harold:8080/muster/',
    database: 'ggsedb'
  }).query({
    select: '*',
    from: 'profile,research_interests',
    where: 'research_interests.profile_id = profile.id and active = \'yes\'',
    order: 'last_name asc'
  }, function() {
    var table = this.serializeJoinedResults('id').toTable([
      [function() { return this.last_name + ', ' + this.first_name; }, 'Full Name'],
      ['title', 'Title'],
      ['interest', 'Research Interests']
    ]);
    $(function() {
      $('body').append(table);
    });
  });

})(jQuery);
