"use strict";

var Hyper_JS = function () {};
_.extend(Hyper_JS, Backbone.Events);

Hyper_JS.new = function (selector, func) {
  var o = new Hyper_JS();
  o.list  = selector;
  o.items = [];
  o.func  = func;
  o.template = $(selector).html();
  o.model = $($.trim(o.template || "")).attr('model');
  $(selector).empty();

  Hyper_JS.trigger('new', Hyper_JS);
  _.extend(o, Backbone.Events);

  if (o.model && Hyper_JS.app()) {
    Hyper_JS.app().on('new:' + o.model, function () {});
    Hyper_JS.app().on('update:' + o.model, function () {});
    Hyper_JS.app().on('trash:' + o.model, function () {});
    Hyper_JS.app().on('untrash:' + o.model, function () {});
    Hyper_JS.app().on('delete:' + o.model, function () {});
  }

  return o;
};

Hyper_JS.app = function (app) {
  if (arguments.length)
    this._app_ = app;
  return this._app_;
};

Hyper_JS.prototype.shift = function () {
  return this.remove('first');
};

Hyper_JS.prototype.pop = function () {
  return this.remove('last');
};

Hyper_JS.prototype.remove = function (pos) {
  var me = this;
  if (!me.items.length)
    return me;
  if (pos === 'first')
    me.items.shift();
  if (pos === 'last')
    me.items.pop();
  me.updated($(me.list).children()[pos]().remove(), pos, 'remove_' + pos);
  return me;
};
Hyper_JS.prototype.prepend = function (o, func) {
  return this.into_dom(o, 'prepend', func);
};

Hyper_JS.prototype.append = function (o, func) {
  return this.into_dom(o, 'append', func);
};

Hyper_JS.prototype.into_dom = function (obj, pos, func) {
  var me       = this;

  if ($.isArray(obj)) {
    var list = (pos === 'prepend') ? obj.reverse() : obj;
    $(obj).each(function (i, o) { me.into_dom(o, pos, func); });
    return me;
  }

  func         = func || me.func;
  var ele      = $(func({obj: obj, Hyper_JS: me}));
  var item     = {item: obj, func: func};
  var was_empty= $(me.list).children().length === 0;

  if (pos === 'append' || pos === 'prepend') {
    if (pos === 'append') {
      me.items.push(item);
    } else {
      me.items.unshift(item);
    }
    $(me.list)[pos](ele);
  } else {
    throw new Error("Not ready to handle positiong: " + pos);
  }

  if (was_empty)
    me.updated(ele, pos, 'no-empty');
  else
    me.updated(ele, pos);
};


Hyper_JS.prototype.updated = function (ele, pos, name) {

  var update = 'update';
  name = name || update;
  var me   = this;
  var args = {list: me, el: ele, pos: pos};
  $(me.afters).each(function (i, f) {
    f(args);
  });

  if (!me.items.length)
    me.trigger('empty', args);

  me.trigger(name, args);

  if (name != update)
    me.trigger(update, args);

  return args;
};










