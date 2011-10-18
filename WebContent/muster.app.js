(function($) {

  'use strict';

  // ITGDD demo
  muster('itg').query({
    select: '*',
    from: 'devices',
    where: "Status <> 'EIMR' or Status is null",
    order: 'Status asc'
  }, function() {
    this.toTable([
      ['Property ID','ITG ID'],
      ['Host Name','hostname'],
      'Status',
      ['Platform', 'platform'],
      ['Model', 'model'],
      ['Serial Number', 'serial no.'],
      'OS',
      'CPU',
      'RAM',
      'Room',
      ['GSE Group', 'Group'],
      'Notes'
    ], '#itgdd');
  });

  // Research Interests demo
  muster({
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
      ['interest', 'Research Interests (list)'],
      [function() {
        if (this.interest instanceof Array) {
          return this.interest.join(', ');
        } else {
          return this.interest;
        }
      }, 'Research Interests (comma separated)']
    ]);

    $($('#researchInterests').append(table));
  });

}(jQuery));

/*jslint browser: true, indent: 2 */
/*global muster, jQuery */

