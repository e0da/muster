$(function() {
  var url = "http://localhost:8080/muster/muster";
  var database = "courses";
  var select = "*";
  var from = "coursesyear";
//  var where = "\"year\" = '2010-11' AND \"day\" = 'TR'";
  var where = "\"year\" = '2010-11'";
  var query = url + "?database="+ escape(database) + "&select=" + escape(select) + "&from=" + escape(from) + "&where=" + escape(where);
  query += "&callback=?";

  $.getJSON(query, function(data) {
    console.log(data);
  });
});

