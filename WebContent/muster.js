(function($) {

function Muster() {

  // allow new Musters to be created with or without `new` operator while preserving arguments
  // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
  var newMuster = (function() {
    function _Muster(args) {
      return Muster.apply(this, args);
    }

    _Muster.prototype = Muster.prototype;

    return function(args) {
      return new _Muster(args);
    };
  })();

  if (!(this instanceof Muster))
    return newMuster(arguments);

  // unambiguous pointer to this instance of Muster
  var muster = this;

  // initialize
  muster.init = function(args) {
    parseArgs(args);
    return this;
  };

  muster.status = function() {
    console.log(muster);
  };

  // perform query. results are loaded into muster.results
  muster.query = function(query, callback) {

    // prepare the query first (sanitize, encode, etc.)
    executeQuery(query, callback);
    return this;
  };

  muster.filter = function(column, value) {
    var filteredResults = $.grep(muster.results, function(n, i) {
      return n[column] == value;
    });
    var c = clone();
    c.results = filteredResults;
    return c;
  }

  muster.hasErrors = function() {
    return muster.errors ? muster.errors.length > 0 : false;
  };

  return muster.init(arguments);

  // parse arguments, populating options, etc.
  function parseArgs(args) {
    // an object full of options
    if (args.length == 1 && typeof args[0] == 'object') {
      var options = args[0];
      muster.url = options.url;
      muster.database = options.database;
    }
  }

  //TODO exceptions
  function executeQuery(query, callback) {
    $.getJSON(prepareQuery(query), function(data) {
      muster.columns = data.columns;
      muster.results = data.results;
      callback();
    });
  }

  //TODO documentation
  function prepareQuery(query) {

    var uri = muster.url + '?database=' + escape(muster.database);

    // assemble the parameters
    $.each([
      'database', 'select', 'from', 'where', 'order'
    ], function() {
      if (query[this] != null && query[this].length > 0) {
        uri += '&' + this + '=' + escape(query[this]);
      }
    });

    uri += '&callback=?'

    return uri;
  }

  function filteredCopy(oldMuster, results) {
    var newMuster = new Muster({
      url: oldMuster.url,
      database: oldMuster.database
    });

    newMuster.results = results;
    newMuster.columns = oldMuster.columns;

    return newMuster;
  }

  function error(msg) {
    muster.errors = muster.errors ? muster.errors : [];
    muster.errors.push(msg);
  }

  function clone() {
    var clone = new Muster();
    for (attr in muster) {
      clone[attr] = muster[attr];
    }
    return clone;
  }
}

// register as static jQuery function
$.muster = Muster;

})(jQuery);

