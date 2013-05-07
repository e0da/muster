## Examples ##

You can get sortable table of your data with custom headers just by doing:

```javascript
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
```

And your table will be injected into the element with id myTable such as 

    <div id=myTable></div>

You shouldn't wait for the page to load (i.e. document.ready). Muster will wait
for the document to load to inject the table, but can retrieve and manipulate
your data as the page loads.

For more information, see the inline documentation in `muster.js`.

## Copyright ##

Copyright 2012 by Justin Force

Licensed under the [MIT License](http://www.opensource.org/licenses/MIT)
