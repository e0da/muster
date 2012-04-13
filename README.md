## Examples ##

You can get sortable table of your data with custom headers just by doing:

    muster('mydb').query({
      select: '*',
      from: 'users',
      where: 'first_name is not null'
    }, function () {
      this.toTable(
        [
          ['First Name', 'first_name'],
          ['Last Name', 'last_name'],
          'email',
          'phone'
      ], '#myTable')
    });

For more information, see the inline documentation in `muster.js`.

## Copyright ##

Copyright 2012 by Justin Force

Licensed under the [MIT License](http://www.opensource.org/licenses/MIT)
