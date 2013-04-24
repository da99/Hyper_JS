"use strict";

// function error(name, e) { throw e;}

var Hyper_JS = function () {};
_.extend(Hyper_JS, Backbone.Events);

Hyper_JS.new = function (selector, models, func) {
  var o = new Hyper_JS();
  o.list     = selector;
  o.items    = [];
  o.models   = [];
  o.funcs    = {object: (func || function () { return null; })};

  o.template = $(selector).html();

  if (_.isObject(models) && !_.isArray(models)) {
    _.each(models, function (f, m) {
      o.func_for(m, f);
      o.models.push(m);
    });
  } else {
    o.models   = o.models.concat(_.uniq(_.compact(_.flatten([models]))));
  }

  $(selector).empty();

  Hyper_JS.trigger('new', Hyper_JS);
  _.extend(o, Backbone.Events);

  if (Hyper_JS.app()) {
    _.each(o.models, function ( name, i ) {
      Hyper_JS.app().on('new:' + name, function (new_model) {
        o.prepend(new_model, name);
      });

      Hyper_JS.app().on('update:' + name, function (new_model) {
        o.update_where('id', new_model, name);
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

Hyper_JS.app = function (app) {
  if (arguments.length)
    this._app_ = app;
  return this._app_;
};

Hyper_JS.prototype.func_for = function (name, func) {
  var me = this;

  if (_.isFunction(func)) {
    this.funcs[name] = func;
    return func;
  }

  return _.compact(_.map(arguments, function (name) {
    return me.funcs[name];
  }))[0] || this.funcs.object;

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

Hyper_JS.prototype.trash_where = function (field, new_model) {
  var me = this;
  me.el_at(me.find_pos_where('id', new_model)).addClass('trashed');
  return me;
};

Hyper_JS.prototype.untrash_where = function (field, new_model) {
  var me = this;
  me.el_at(me.find_pos_where('id', new_model)).removeClass('trashed');
  return me;
};

Hyper_JS.prototype.el_at = function (pos) {
  return $($(this.list).children()[pos]);
};

Hyper_JS.prototype.find_pos_where = function (field, new_model) {
  var me         = this;
  var target_val = $.isPlainObject(new_model) ? new_model[field] : new_mode;
  var pos        = null;

  _.find(me.items, function (o, i) {
    if (o[field] === target_val)
      pos = i;

    return pos !== null;
  });

  return pos;
};

Hyper_JS.prototype.delete_where = function (field, new_model) {

  var me = this;
  var pos = me.find_pos_where(field, new_model);
  if (pos === null)
    return me;

  me.items.splice(pos, 1);
  me.el_at(pos).remove();
  return me;
};

Hyper_JS.prototype.update_where = function (field, new_model, type) {
  var me = this;
  var pos = me.find_pos_where(field, new_model);

  if (pos === null)
    return me.prepend(new_model);

  me.items[pos] = new_model;

  me.el_at(pos)
  .replaceWith(me.func_for(new_model[field], type)(new_model, me));

  return me;
};

Hyper_JS.prototype.prepend = function (o, func, type) {
  return this.into_dom(o, 'prepend', func, type);
};

Hyper_JS.prototype.append = function (o, func, type) {
  return this.into_dom(o, 'append', func, type);
};

Hyper_JS.prototype.into_dom = function (obj, pos, func, type) {
  var me       = this;

  if (_.isString(func)) {
    type = func;
    func = null;
  }

  if ($.isArray(obj)) {
    var list = (pos === 'prepend') ? obj.reverse() : obj;
    $(obj).each(function (i, o) { me.into_dom(o, pos, func); });
    return me;
  }

  if (func)
    me.func_for(obj.id, func);
  var ele      = $(me.func_for(obj.id, type)(obj, me));
  var was_empty= $(me.list).children().length === 0;

  if (pos === 'append' || pos === 'prepend') {
    if (pos === 'append') {
      me.items.push(obj);
    } else {
      me.items.unshift(obj);
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










