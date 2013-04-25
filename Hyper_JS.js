"use strict";


// ================================================================
// === Main Stuff
// ================================================================


var Hyper_JS = function () {};

_.extend(Hyper_JS, Backbone.Events);

Hyper_JS.default_func = function (o) { return null; };

Hyper_JS.sort_func = function (a, b) {
  return a.id > b.id;
};

Hyper_JS.app = function (app) {
  if (arguments.length)
    this._app_ = app;
  return this._app_;
};

Hyper_JS.new = function (selector, models, func) {
  if (arguments.length === 2 && _.isString(selector) && _.isFunction(models)) {
    models   = selector;
    func     = models;
    selector = null;
  }

  if (arguments.length === 1) {
    models = selector;
    selector = null;
  }

  var o = new Hyper_JS();
  _.extend(o, Backbone.Events);
  o.list     = selector;
  o.items    = [];
  o.models   = null;
  o.funcs    = {object: Hyper_JS.default_func};


  if (_.isFunction(func))
    o.funcs.object = func;

  if (selector) {
    o.template = $(selector).html();
    $(selector).empty();
  }

  if (_.isObject(models) && !_.isArray(models)) {
    _.extend(o.funcs, models);
    models = _.keys(models);
  }

  o.models = _.uniq(_.compact(_.flatten([models])));

  // === broadcast the birth of this object.
  Hyper_JS.trigger('new', o);

  // === setup notifys.
  if (Hyper_JS.app()) {
    _.each(o.models, function ( name, i ) {
      Hyper_JS.app().on('new:' + name, function (new_model) {
        o.insert(new_model, name);
      });

      Hyper_JS.app().on('update:' + name, function (new_model) {
        o.update_where('id', new_model);
      });

      Hyper_JS.app().on('trash:' + name, function (new_model) {
        o.trash_where('id', new_model);
      });

      Hyper_JS.app().on('untrash:' + name, function (new_model) {
        o.untrash_where('id', new_model);
      });

      Hyper_JS.app().on('delete:' + name, function (new_model) {
        o.delete_where('id', new_model);
      });
    });
  }

  return o;
};


// ================================================================
// === meta/find stuff
// ================================================================

Hyper_JS.prototype.el_at = function (pos) {
  return $($(this.list).children()[pos]);
};

Hyper_JS.prototype.item_where = function (field, new_model) {
  var me         = this;
  var target_val = $.isPlainObject(new_model) ? new_model[field] : new_model;
  var pos        = null;

  _.find(me.items, function (o, i) {
    if (o.data[field] === target_val)
      pos = i;

    return pos !== null;
  });

  return pos;
};

Hyper_JS.prototype.func_at = function (pos) {
  var me = this;
  return me.items[pos].func;
};

Hyper_JS.prototype.sort = function (func) {
  var me       = this;
  me.sort_func = (func || Hyper_JS.sort_func);
  var els      = $(me.list).children();
  var list     = _.map(me.items, function (o, i) {
    return [i, o, $(els[i]).detach()];
  });

  list.sort(function (a, b) {
    return me.sort_func(a[1].data,  b[1].data);
  });

  _.each(list, function (entry) {
    me.items.shift();
    me.items.push(entry[1]);
    $(me.list).append(entry[2]);
  });
  return me;
};

// ================================================================
// === create/new
// ================================================================

Hyper_JS.prototype.insert = function (obj, func) {
  var me       = this;
  if ($.isArray(obj)) {
    _.each(obj, function (o) { me.insert(o, func); });
    return me;
  }

  var item = {data: obj};
  var pos  = null;

  if (_.isString(func)) {
    item.model = func;
    item.func  = me.funcs[func];
  }

  if (_.isFunction(func))
    item.func = func;

  if (!item.func)
    item.func  = me.funcs.object;

  var ele = item.func(obj, me);

  if (_.isArray(ele)) {
    pos = ele[0];
    ele = ele[1];
  }

  if (!_.isNumber(pos) && me.sort_func) {
    var new_list = _.pluck(me.items, 'data');
    new_list.push(item.data);
    new_list.sort( me.sort_func );
    pos = new_list.indexOf(item.data);
  }

  if (pos === 'top' || !_.isNumber(pos) || _.isNaN(pos))
    pos = 0;
  if (pos === 'bottom')
    pos = me.items.length;

  var prev = me.items[pos];


  if (prev) {
    me.items.splice(pos, 0, item);
  } else {
    me.items[pos] = item;
  }

  if (!ele)
    return me;

  ele = $(ele);

  var prev = $(me.list).children()[pos];
  if (prev) {
    $(prev).before(ele);
  } else {
    $(me.list).append(ele);
  }

  return me;
};


// ================================================================
// === update
// ================================================================

Hyper_JS.prototype.update_where = function (field, new_model) {
  var me = this;
  var pos = me.item_where(field, new_model);

  if (pos === null)
    return me;

  var meta = me.items[pos];
  meta.data = new_model;

  me.el_at(pos)
  .replaceWith(meta.func(new_model, me));

  return me;
};


// ================================================================
// === trash/untrash
// ================================================================


Hyper_JS.prototype.trash_where = function (field, new_model) {
  var me = this;
  me.el_at(me.item_where('id', new_model)).addClass('trashed');
  return me;
};

Hyper_JS.prototype.untrash_where = function (field, new_model) {
  var me = this;
  me.el_at(me.item_where('id', new_model)).removeClass('trashed');
  return me;
};


// ================================================================
// === delete/remove
// ================================================================

Hyper_JS.prototype.delete_where = function (field, new_model) {

  var me = this;
  var pos = me.item_where(field, new_model);
  if (pos === null)
    return me;

  me.items.splice(pos, 1);
  me.el_at(pos).remove();
  return me;

};












