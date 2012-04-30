var utils = exports;

utils.toSource = function (obj, filter) {

  function walk(obj) {
    switch (typeof obj) {
      case 'string':
        return JSON.stringify(obj);
      case 'boolean':
      case 'number':
      case 'function':
        return obj.toString();
    }

    //recursion
    var keys = Object.keys(obj);
    return keys.length ? '{' + keys.map(function (key) {
      if (filter.indexOf(key) >= 0) {
        console.log('key %s filtered', key);
        return key + ':' + '"*****"';
      } else {
        return key + ':' + walk(obj[key]);
      }
    }).join(',') + '}' : '{}';
  }

  return walk(obj);
};

/*
 * From socket.io
 * Merges two objects.
 *
 * TODO: filter
 *
 * @api public
 */
utils.merge = function merge (target, additional, deep, lastseen) {
  var seen = lastseen || []
    , depth = typeof deep == 'undefined' ? 2 : deep
    , prop;

  for (prop in additional) {
    if (additional.hasOwnProperty(prop) && seen.indexOf(prop) < 0) {
      if (typeof target[prop] !== 'object' || !depth) {
        target[prop] = additional[prop];
        seen.push(additional[prop]);
      } else {
        utils.merge(target[prop], additional[prop], depth - 1, seen);
      }
    }
  }

  return target;
};
