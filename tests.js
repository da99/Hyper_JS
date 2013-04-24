
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
    </ul>');

var template = function (o) {
  return "<li>" + o.name + "</li>";
};

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


// ==== append

test("append: runs .trigger('no-empty') if list was previously empty", function () {
  var events = [];
  list.on('no-empty', function () { events.push('no longer empty'); });
  list.append({name: "Konrad Zuze", job: "genius"});
  assert.deepEqual(["no longer empty"], events);
});

test("append: adds element to bottom", function () {
  list.append({name: "Ted Nelson", job: "genius"});
  assert("Ted Nelson", $('#list li').last().text());

  list.append({name: "Michael Faraday", job: "genius"});
  assert("Michael Faraday", $('#list li').last().text());
});

test('append: accepts an array of objects', function () {
  list.append([{name: "789", job: "numbers"}, {name:"012", job: "numbers"}]);
  assert.deepEqual(["789", "012"], [$('#list li').slice(-2,-1).text(), $('#list li').last().text()]);
});

test("append: runs .trigger('update')", function () {
  var events = [];
  list.on('update', function () {
    events.push('new push');
  });
  list.append({name: "David Talbott", job: "genius"});
  list.off('update');
  assert.deepEqual(["new push"], events);
});

// ==== prepend

test('prepend: accepts an array of objects', function () {
  list.prepend([{name: "123", job: "numbers"}, {name:"456", job: "numbers"}]);
  assert.deepEqual(["123", "456"], [$('#list li').first().text(), $($('#list li')[1]).text()]);
});

test("prepend: adds element to top", function () {
  list.prepend({name: "Alan Kay", job: "genius"});
  assert("Alan Kay", $('#list li').first().text());

  list.prepend({name: "Engelbart", job: "genius"});
  assert("Engelbart", $('#list li').first().text());
});

test("prepend: runs .trigger('update')", function () {
  var events = [];
  list.on('update', function () {
    events.push('new unshift');
  });

  list.prepend({name: "Wal Thornhill", job: "genius"});
  list.off('update');


  assert.deepEqual(["new unshift"], events);
});


test("pop: runs .trigger('empty') if last element is pop-ed", function () {
  $('#list_2nd').empty();
  var events = [];
  var list = Hyper_JS.new('#list_2nd', null, function () { return '<li>text</li>'; }, []);
  list.append({name: "Wally", job: 'lay about'});
  list.on('empty', function () { events.push('now empty'); });
  list.pop();
  assert('now empty', events[0]);
});

test('pop: removes element at bottom', function () {
  var text = $('#list li').last().text();
  list.append({name: "1", job: "genius"});
  list.pop();
  assert(text, $('#list li').last().text());
});

test("shift: runs .trigger('empty') if last element is shift-ed", function () {
  $('#list_2nd').empty();
  var events = [];
  var list = Hyper_JS.new('#list_2nd', null, function () { return '<li>text</li>'; }, []);
  list.append({name: "Wally", job: 'lay about'});
  list.on('empty', function () { events.push('now empty'); });
  list.shift();
  assert('now empty', events[0]);
});

test('shift: removes element at top', function () {
  var text = $('#list li').first().text();
  var next = $($('#list li')[1]).text();
  list.shift();
  assert(next, $('#list li').first().text());
});


test("Hyper_JS.on('new'): runs on .new call", function () {
  var events = [];
  Hyper_JS.on('new', function (o) { events.push('created'); });
  Hyper_JS.new('#list_2nd', null, function () {}, []);
  assert("created", events[0]);
})

// ==== events

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
  list.append({id: name, name: name, job: "being 2"});
  App.trigger('update:genius', {id: name, name: name + 'updated', job: 'num'});
  assert(name+'updated', $('#list li').last().text());
});

test('trash:model adds class "trashed"', function () {
  App.trigger('trash:genius', {id: 'one'});
  assert('trashed', $('#list li').first().attr('class'));
});

test('untrash:model removes class "trashed"', function () {
  App.trigger('untrash:genius', {id: 'one'});
  assert('', $('#list li').first().attr('class'));
});

test('delete:model removes element from list', function () {
  var name = "Two_2456";
  list.prepend({id: name, name: name, job: "two"});
  App.trigger('delete:genius', {id: name});
  assert(0, $('#list li').filter(function () { return $(this).text() === name; }).length);
});

test('delete:model removes element from list.items', function () {
  var name = "Two_20";
  list.prepend({id: name, name: name, job: "two"});

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

  list.append({id: 1, name: 'Bob'}, 'genius');
  list.prepend({id: 2, name: 'Bob 2'}, 'villian');
  assert.deepEqual(['genius: Bob', 'villian: Bob 2'],
                   [$('#list_multi_model li').last().text(), $('#list_multi_model li').first().text()]);
});

test('multi-model: adds events for each model', function () {
  var list = Hyper_JS.new(null, { mod_1: function (o) {}, mod_2 : function (o) { }});
  var actual = _.filter(_.keys(App.events_map), function (name) { return name.indexOf('mod_') > -1; });
  var target = [];
  _.each(['mod_1', 'mod_2'], function (mod) {
    _.each('new update trash untrash delete'.split(' '), function (e) {
      target.push(e+':'+mod);
    });
  });

  assert.deepEqual(target, actual);
});

