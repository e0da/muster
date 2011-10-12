(function($) {

  'use strict';

  // ITGDD demo
  new Muster({
    url: 'http://harold:8080/muster/',
    database: 'itg'
  }).query({
    select: '*',
    from: 'devices',
    where: "Status <> 'EIMR' or Status is null",
    order: 'Status asc'
  }, function() {
    var table = this.toTable([
      ['Property ID','ITG ID'],
      ['Host Name','hostname'],
      ['Status', 'Status'],
      ['Platform', 'platform'],
      ['Model', 'model'],
      ['Serial Number', 'serial no.'],
      ['OS', 'OS'],
      ['CPU', 'CPU'],
      ['RAM', 'RAM'],
      ['Room', 'Room'],
      ['GSE Group', 'Group'],
      ['Notes', 'Notes']
    ]);
    $(function() {
      $('body').append(table);
    });
  });

  // Research Interests demo
  new Muster({
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

}(jQuery));

