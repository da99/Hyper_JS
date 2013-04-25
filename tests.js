
$('#stage').html('\
    <ul id="list">      \
      <li model="genius">{name}</li> \
    </ul>               \
                        \
    <ul id="list_2nd">  \
      <li>{name}</li>   \
    </ul>               \
                        \
    <ul id="list_multi_model"> \
    </ul>               \
                        \
    <ul id="list_sort"> \
    </ul>');

var template = function (o) {
  return "<li>" + o.name + "</li>";
};

var _last_id_ = 0;

function last_id() { return 'o_' + _last_id_; }
function new_id() {
  _last_id_ = parseInt(last_id().replace('o_', ''), 10) + 1;
  return last_id();
}

var App = {
  events : [],
  events_map : {},
  trigger : function (name, o) {
    this.events_map[name](o);
    return this;
  },
  on : function (name, func) {
    this.events.push([name, func]);
    this.events_map[name] = func;
  }
};

Hyper_JS.app(App);
var list = Hyper_JS.new("#list", 'genius', template);

// ==== new

test(".new: emptys element containing models", function () {
  assert(0, $('#list').children().length);
});

test(".new: saves html to .template", function () {
  assert('<li model="genius">{name}</li>', $.trim(list.template));
});


// ==== insert

test('insert: accepts an array of objects', function () {
  list.insert([{name: "123", job: "numbers"}, {name:"456", job: "numbers"}]);
  assert.deepEqual(["123", "456"].reverse(), [$('#list li').first().text(), $($('#list li')[1]).text()]);
});

test("insert: adds element to top", function () {
  list.insert({name: "Alan Kay", job: "genius"});
  assert("Alan Kay", $('#list li').first().text());

  list.insert({name: "Engelbart", job: "genius"});
  assert("Engelbart", $('#list li').first().text());
});

// ==== events

test("Hyper_JS.on('new'): runs on .new call", function () {
  var events = [];
  Hyper_JS.on('new', function (o) { events.push('created'); });
  Hyper_JS.new('#list_2nd', null, function () {}, []);
  assert("created", events[0]);
})

test("adds model events to App", function () {
  assert.deepEqual(['new:genius',
    'update:genius',
    'trash:genius',
    'untrash:genius',
    'delete:genius'], _.pluck(App.events, 0));
});

test('new:model prepends model to list', function () {
  App.trigger('new:genius', {id: 'one', name: 'Uno', job: 'num'});
  assert('Uno', $('#list li').first().text());
});

test('update:model updates model', function () {
  var name = "update_dos";
  App.trigger('new:genius', {id: name, name: name, job: "being 2"});
  App.trigger('update:genius', {id: name, name: name + 'updated', job: 'num'});
  assert(name+'updated', $('#list li').first().text());
});

test('trash:model adds class "trashed"', function () {
  App.trigger('new:genius', {id: new_id(), name: last_id(), job: last_id()});
  App.trigger('trash:genius', {id: last_id()});
  assert('trashed', $('#list li').first().attr('class'));
});

test('untrash:model removes class "trashed"', function () {
  App.trigger('new:genius', {id: new_id(), name: last_id(), job: last_id()});
  App.trigger('trash:genius', {id: last_id()});
  App.trigger('untrash:genius', {id: last_id()});
  assert('', $('#list li').first().attr('class'));
});

test('delete:model removes element from list', function () {
  var name = "delete_" + new_id();
  App.trigger('new:genius', {id: name, name: name, job: "two"});
  App.trigger('delete:genius', {id: name});
  assert(0, $('#list li').filter(function () { return $(this).text() === name; }).length);
});

test('delete:model removes element from list.items', function () {
  var name = "Two_20";
  list.insert({id: name, name: name, job: "two"});

  var o_size = list.items.length;
  App.trigger('delete:genius', {id: name});
  assert(o_size - 1, list.items.length);
});

// === multi-models

test('multi-model: accepts a different function for each model', function () {
  var list = Hyper_JS.new('#list_multi_model', {genius: function (o) {
    return "<li>genius: " + o.name + '</li>';
  },
  villian : function (o) {
    return "<li>villian: " + o.name + '</li>';
  }});

  App.trigger('new:genius', {id: 1, name: 'Bob'});
  App.trigger('new:villian', {id: 2, name: 'Bob 2'});
  assert.deepEqual(['genius: Bob', 'villian: Bob 2'],
                   [$('#list_multi_model li').last().text(), $('#list_multi_model li').first().text()]);
});

test('multi-model: adds events for each model', function () {
  var list = Hyper_JS.new({ mod_1: function (o) {}, mod_2 : function (o) { }});
  var actual = _.filter(_.keys(App.events_map), function (name) { return name.indexOf('mod_') > -1; });
  var target = [];
  _.each(['mod_1', 'mod_2'], function (mod) {
    _.each('new update trash untrash delete'.split(' '), function (e) {
      target.push(e+':'+mod);
    });
  });

  assert.deepEqual(target, actual);
});


// ================================================================
// ==== sorting
// ================================================================


test('sorting: by default, sorts by id', function () {
  $('#list_sort').empty();

  var ids = _.map([0,1,2,3], function (num) {
    return 'animal_' + num;
  });

  var list = Hyper_JS.new('#list_sort', 'animal', function (o) { return '<li>' + o.name + '</li>'});
  App.trigger('new:animal', {id: ids[2], name: ids[2]});
  App.trigger('new:animal', {id: ids[1], name: ids[1]});
  App.trigger('new:animal', {id: ids[3], name: ids[3]});
  App.trigger('new:animal', {id: ids[0], name: ids[0]});

  list.sort();

  var exp = ids;
  var actual = _.map($('#list_sort li'), function (o) { return $(o).text(); });
  assert.deepEqual(exp, actual);
});


test('sorting: sorts (private) .items', function () {
  $('#list_sort').empty();

  var ids = _.map([0,1,2], function (num) {
    return 'animal_' + num;
  });

  var list = Hyper_JS.new('#list_sort', 'animal', function (o) { return '<li>' + o.name + '</li>'});
  App.trigger('new:animal', {id: ids[2], name: ids[2]});
  App.trigger('new:animal', {id: ids[1], name: ids[1]});
  App.trigger('new:animal', {id: ids[0], name: ids[0]});

  list.sort();

  var exp = ids;
  var actual = _.pluck(_.pluck(list.items, 'data'), 'id');
  assert.deepEqual(exp, actual);
});


test('sorting: accepts a cusotm sort function', function () {
  $('#list_sort').empty();

  var ids = _.map([0,1,2], function (num) {
    return 'animal_' + num;
  });

  var list = Hyper_JS.new('#list_sort', 'animal', function (o) { return '<li>' + o.name + '</li>'});
  App.trigger('new:animal', {id: ids[2], name: ids[2]});
  App.trigger('new:animal', {id: ids[0], name: ids[0]});
  App.trigger('new:animal', {id: ids[1], name: ids[1]});

  list.sort(function (a, b) {
    return a.id < b.id;
  });

  var exp = ids.reverse();
  var actual = _.map($('#list_sort li'), function (o) { return $(o).text(); });
  assert.deepEqual(exp, actual);
});

test('sorting: sorts new elements after sort is applied', function () {
  $('#list_sort').empty();

  var ids = _.map([0,1,2,3], function (num) {
    return 'animal_' + num;
  });

  var list = Hyper_JS.new('#list_sort', 'animal', function (o) { return '<li>' + o.name + '</li>'});
  App.trigger('new:animal', {id: ids[2], name: ids[2]});
  App.trigger('new:animal', {id: ids[0], name: ids[0]});
  App.trigger('new:animal', {id: ids[3], name: ids[3]});

  list.sort(function (a, b) {
    return a.id < b.id;
  });

  App.trigger('new:animal', {id: ids[1], name: ids[1]});

  var exp = ids.reverse();
  var actual = _.map($('#list_sort li'), function (o) { return $(o).text(); });
  assert.deepEqual(exp, actual);
});
































