'use strict';

const { oneLine } = require('common-tags');

function ensureType (obj, _class) {
  if(_class instanceof Array) {
    const valid = _class.map(e=> {
      try {
        ensureType(obj, e, false);
        return true;
      } catch (e) {
        return false;
      }
    }).reduce((a,e)=>e||a,false);
    if(valid) return;
    throw new TypeError(oneLine`Expected one of [${_class.map(e=>(e===null||e===undefined)?typeof e:e.name).join(',')}],
    got ${(obj===null||obj===undefined)?typeof obj:obj.constructor.name}`);
  }
  if(_class===null || _class===undefined) {
    if(obj !== _class) throw new TypeError(`Expected ${typeof _class}, got ${(obj===null||obj===undefined)?typeof obj:obj.constructor.name}`);
    return;
  }
  if(obj===null||obj===undefined) throw new TypeError(`Expected ${_class.name}, got ${typeof obj}`);
  if(obj.constructor !== _class && !(obj instanceof _class)) throw new TypeError(`Expected ${_class.name}, got ${obj.constructor.name}`);
}

function findIndices (iterable, search) {
  if(typeof iterable[Symbol.iterator] !== 'function') throw TypeError('\'iterable\' is not iterable');
  const indices = [];
  let fn;
  if(typeof search === 'function') {
    fn = search;
  } else {
    fn = e=>Object.is(e,search);
  }
  const iter = iterable[Symbol.iterator]();
  let i = 0;
  let value;
  while(!({value}=iter.next()).done) {
    if(fn(value)) indices.push(i);
  }
  return indices;
}

module.exports = {
  ensureType,
  findIndices
};
