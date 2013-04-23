"use strict";

var Hyper_JS = function () {};

Hyper_JS.new = function (selector, func, opt_arr) {
  var o = new Hyper_JS();
  o.list = selector;
  o.items = [];
  o.func = func;
  if (opt_arr) {
    $(opt_arr).each(function (i, e) {
      o.push(e);
    });
  }

  return o;
};


Hyper_JS.prototype.pop = function () {
  var me = this;
  me.items.pop();
  me.updated($(me.list).last().remove(), 'pop');
  return me;
};

Hyper_JS.prototype.prepend = function (o, func) {
  return this.into_dom(o, 'prepend', func);
};

Hyper_JS.prototype.append = function (o, func) {
  return this.into_dom(o, 'append', func);
};

Hyper_JS.prototype.into_dom = function (obj, pos, func) {
  var me   = this;
  func     = func || me.func;
  var ele  = $(func({obj: obj, Hyper_JS: me}));
  var item = {item: obj, func: func};

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

  me.updated(ele, pos);
};


Hyper_JS.prototype.updated = function (ele, pos) {
  var me   = this;
  var args = {list: me, el: ele, pos: pos};
  $(me.afters).each(function (i, f) {
    f(args);
  });

  return args;
};









