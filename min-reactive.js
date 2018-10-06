Klass = function (proto) {
  var _const = proto.__init__ || function () { };
  _const.prototype = proto;

  return _const;
}

Watch = Klass({
  typename: 'min-reactive.State',

  __init__: function (state, handler) {
    this.state = state;
    this.handler = handler;
  },

  unwatch: function () {
    this.state.unwatch(this.handler);
  }
});

State = Klass({
  typename: 'min-reactive.State',

  __init__: function (value) {
    this.watchers = [];
    this.value = value;
  },

  set: function (value) {
    this.value = value;
    this.notify();
    return this;
  },

  shadowset: function (value) {
    this.value = value;
    return this;
  },

  get: function () {
    return this.value;
  },

  notify: function () {
    for (var index = 0; index < this.watchers.length; index++)
      this.watchers[index](this);
    return this;
  },

  watch: function (handler) {
    this.watchers.push(handler);
    return new Watch(this, handler);
  },

  unwatch: function (handler) {
    var index = this.watchers.indexOf(handler);
    this.watchers.splice(index, 1);
    return this;
  },
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[react-to]').forEach(elem => {
    var template = nunjucks.compile(elem.innerHTML);
    var scope = eval('(' + elem.getAttribute('react-to') + ')');
    var keys = Object.keys(scope);

    var buildContext = function () {
      var result = {};
      for (var index = 0; index < keys.length; index++) {
        var key = keys[index];
        var value = scope[key];

        if (value.typename == 'min-reactive.State')
          result[key] = value.get();
        else result[key] = value;
      }

      return result;
    };

    for (var index = 0; index < keys.length; index++) {
      var key = keys[index];
      var value = scope[key];
      if (value.typename == 'min-reactive.State') {
        value.watch(function () {
          template.render(buildContext(), function (error, rendered) {
            console.log(error)
            if (!error)
              elem.innerHTML = rendered;
          });
        });
      }
    }

    elem.innerHTML = template.render(buildContext());

  })

  document.querySelectorAll('input[bind-to]').forEach(function (elem) {
    var state = eval(elem.getAttribute('bind-to'));

    state.watch(function () {
      if (elem.value != state.value)
        elem.value = state.value;
    });

    elem.value = state.value;

    'keyup keypress keydown blur focus change'
      .split(' ')
      .forEach(eventName => {
        elem.addEventListener(eventName, () => {
          if (elem.value != state.value) {
            state.set(elem.value);
          }
        }, false)
      })
  });
});
