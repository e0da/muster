$(function() {

  /*
  * 1. Test queries/confirm table/field names
  *
  * 2. Determine page layout
  *
  * 3. Optimize queries
  */

  var ggsedb = muster({ 
    url: "http://harold.justinforce.com:8080/muster/muster",
    database: "ggsedb"
  });

//    where: "\"year\" = '2010-11'",

  var queries = [];

  queries.push({
    select: "id,title,year_begin,year_end,award_amount,source,abstract,\"grant closed\"",
    from: "grants_and_contracts",
    where: ""
  });

  queries.push({
    select: "grants_and_contracts_id,profile_id,pi_type",
    from: "grants_and_contracts_lookup",
    where: ""
  });

  queries.push({
    select: "first_name,last_name",
    from: "profile",
    where: ""
  });

  $.each(queries, function() {
    var rows = ggsedb.query({
      select: this.select,
      from: this.from,
      where: this.where,
      order: this.order,
      callback: function(rows) {
        $('body').append(ggsedb.toTable());
      }
    });
  });

});

