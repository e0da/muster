/*jslint browser: true, indent: 2 */
/*global muster, jQuery */

(function ($) {

  'use strict';

  muster('ggsedb').query({
    select: [
      'profile.id as id',
      'first_name',
      'last_name',
      'publications."year" as pubyear',
      'publications.title as pubtitle'
    ].join(','),
    from: 'profile left join publications on publications.profile_id = profile.id',
    where: 'profile.id is not null'
  }, function () {
    var m = this.serializeBy('id', [
      { publications: {title: 'pubtitle', year: 'pubyear'} }
    ]);
    m.toTable([
      [ 'Name', function () { return this.first_name + ' ' + this.last_name; } ],
      [ 'publications', function () {
        var out = $('<ul>');

        function titleAndYear(title, year) {
          if (!title) {
            return null;
          } else {
            return title + (year ? ', ' + year : '');
          }
        }

        if (this.publications instanceof Array) {
          $.each(this.publications, function () {
            if (this === undefined) {
              return null;
            }
            out.append($('<li>').text(titleAndYear(this.title, this.year)));
          });
          return out;
        } else {
          return titleAndYear(this.publications.title, this.publications.year);
        }
      }]
    ], '#researchInterests');
  });

  // ITGDD demo
  muster('itg').query({
    select: '*',
    from: 'devices',
    where: "Status <> 'EIMR' or Status is null",
    order: 'Status asc'
  }, function () {
    this.toTable([
      ['ITG ID', 'Property ID'],
      ['Hostname', 'Host Name'],
      'Status',
      'Platform',
      'Model',
      'Serial Number',
      'OS',
      'CPU',
      'RAM',
      'Room',
      ['Group', 'GSE Group'],
      'Notes'
    ], '#itgdd');
  });
  /*

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
      [
        'Full Name',
        
        function() {
          return this.last_name + ', ' + this.first_name;
        }
      ],
      ['Title', 'title'],
      ['Research Interests (list)', 'interest'],
      [
        'Research Interests (comma separated)',
        
        function() {
          if (this.interest instanceof Array) {
            return this.interest.join(', ');
          } else {
            return this.interest;
          }
        }
      ]
    ]);

    $($('#researchInterests').append(table));
  });
*/
}(jQuery));

