$(function() {

  var muster = $.muster({ 
    url: "http://harold.justinforce.com:8080/muster/muster",
      database: "courses",
  });

  var results = muster.query({
    select: "course,Instructor_Name,description",
    from: "coursesyear",
    where: "\"year\" = '2010-11'",
    callback: function(results) {
      $('body').append(muster.toTable());
    }
  });
});
