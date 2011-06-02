$(function() {

  var ggsedb = muster({ 
    url: "http://harold.justinforce.com:8080/muster/muster",
    database: "ggsedb"
  });

  // List of queries which depend upon one another. We can't start using this
  // data until all of these queries are complete.
  var blockingQueries = ['grants_and_contracts', 'grants_and_contracts_lookup', 'profile'];

  ggsedb.query({
    select: "id,title,year_begin,year_end,award_amount,source,abstract",
    from: "grants_and_contracts",
    where: "\"grant closed\" IS NULL AND (\"grant type\" = 'Grant' OR \"grant type\" = 'Income/MOU')",
    order: "year_begin DESC",
    callback: function(results) {
      blockingQueries['grants_and_contracts'] = results;
      allBlockingQueriesFinished();
    }
  });

  ggsedb.query({
    select: "grants_and_contracts_id,profile_id,pi_type",
    from: "grants_and_contracts_lookup",
    callback: function(results) {
      blockingQueries['grants_and_contracts_lookup'] = results;
      allBlockingQueriesFinished();
    }
  });

  ggsedb.query({
    select: "id,first_name,last_name",
    from: "profile",
    callback: function(results) {
      blockingQueries['profile'] = results;
      allBlockingQueriesFinished();
    }
  });

  setInterval(function() {
    var rand = Math.random();
    ggsedb.query({
      select: "*",
      from: "grants_and_contracts",
      where: "\"grant type\" != '" + rand + "'"
    });
  }, 250);

  function allBlockingQueriesFinished() {
    var finished = true;
    $.each(blockingQueries, function() {
      if (blockingQueries[this] == null) {
        finished = false;
      }
    });
    if (finished) {
      $(window).trigger('allqueriesfinished');
    }
  }

  $(window).bind('allqueriesfinished', function(e) {

    //TODO this is where the magic happens. Now we have all of the data, it's time to do things with it.

    /* reusable variables for table manipulation */
    var table, thead, tbody, tr, td, columns;

    var grantsAndContracts = blockingQueries['grants_and_contracts'];
    var grantsAndContractsLookup = blockingQueries['grants_and_contracts_lookup'];
    var profiles = blockingQueries['profile'];

    columns = ['id', 'title'];
    table = $('<table><thead><tr><tbody>');
    thead = table.find('thead tr');
    $.each(columns, function() {
      thead.append('<th>' + this);
    });

    tbody = table.find('tbody');
    $.each(grantsAndContracts.results, function() {
      var result = this;
      tr = $('<tr>');
      tbody.append(tr);

      /* Make the principal investigators cell */
      td = $('<td>');

      /* Get PIs */
      var pis = $.grep(grantsAndContractsLookup.results, function(element, index) {
        return element.grants_and_contracts_id == result.id;
      });

      /* Get the PIs' names and put them in the cell */
      var names = [];
      $.each(pis, function() {
        var pi = this;
        var people = $.grep(profiles.results, function(element, index) {
          return element.id == pi.profile_id;
        });
        $.each(people, function() {
          names.push(this.last_name + ', ' + this.first_name);
        });
      });
      td.append(names.join(' / '));
      tr.append(td);

      /* Insert the title */
      td = $('<td>');
      var title = $('<a>').attr('href', '#');
      title.text(result.title);
      td.append(title);

      /* When the title is clicked, toggle supplementary information */
      title.toggle(function(e) {
        e.stopPropagation();
        e.preventDefault();
        inner.slideDown('fast');
      }, function(e) {
        e.stopPropagation();
        e.preventDefault();
        inner.slideUp('fast');
      });

      tr.append(td);

      /* Add supplementary information below title */
      var innerRow = $('<tr>');
      var innerCol = $('<td>');
      var inner = $('<div>');
      innerRow.append(innerCol);
      innerCol.append(inner);
      innerCol.attr('colspan', 2);
      tr.after(innerRow);
      inner.hide();

      var dl = $('<dl>');
      var fields = ['award_amount', 'year_begin', 'year_end', 'source', 'abstract'];
      $.each(fields, function() {
        if (result[this] != null && result[this] != "null") {
          dl.append('<dt>' + this);
          dl.append('<dd>' + result[this]);
        }
      });

      inner.append(dl);
    });

    $('body').append(table);

    /* TODO this is for demo purposes. Scrutinize this later. */
    $('body').prepend(
      $('<strong>toggle all</strong>').click(function() {
        $('a').click();
      }).css({display: 'block', textAlign: 'right', cursor: 'pointer'})
    );
  });
});
