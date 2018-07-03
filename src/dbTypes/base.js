'use strict';
const util = require('util');
const { ensureType } = require('../util');

const privates = new WeakMap();

class Base {
  constructor(name) {
    if (new.target === Base) {
      throw new TypeError('Cannot construct Abstract instances directly');
    }
    let _private = privates.set(this, {}).get(this);
    _private.name = name;
    _private.safeName = name.replace(/`/g,'``');
    _private.children = new Set();
    _private.exposedChildren = null;
    _private.parent = null;
  }

  get name() {
    return privates.get(this).name;
  }

  set name(val) {
    privates.get(this).safeName = val.replace(/`/g,'``');
    privates.get(this).name = val;
  }

  get safeName() {
    return privates.get(this).safeName;
  }

  get children () {
    const _private = privates.get(this);
    return _private.exposedChildren || (_private.exposedChildren = Object.freeze([..._private.children]));
  }

  get parent() {
    return privates.get(this).parent;
  }

  set parent(val) {
    ensureType(val, Base);
    const _private = privates.get(this);
    if(_private.parent) _private.parent.remove(this);
    _private.parent = val;
  }

  get(obj, type) {
    ensureType(obj, [Base, String]);
    const _private = privates.get(this);
    if(_private.children.has(obj)) {
      return obj;
    }
    const foundObj = this.children.find(e=>e.name === obj);
    if(foundObj && type !== undefined) ensureType(foundObj, type);
    return foundObj;
  }

  add(obj) {
    ensureType(obj, Base);
    const _private = privates.get(this);
    if(_private.children.has(obj)) {
      return this;
    }
    _private.children.add(obj);
    obj.parent = this;
    this.invalidateCache();
    return this;
  }

  remove(obj) {
    ensureType(obj, [Base, String]);
    const _private = privates.get(this);
    if(obj instanceof Base) {
      _private.children.delete(obj);
    } else {
      _private.children.delete(this.children.find(e=>e.name===obj));
    }
    this.invalidateCache();
    return this;
  }

  invalidateCache() {
    privates.get(this).exposedChildren = null;
  }

  toString() {
    return this.name;
  }

  [util.inspect.custom](depth, opts) {
    const className = this.constructor.name;
    return `${opts.stylize(className, 'special')}(${opts.stylize(this.name, 'string')})`;
  }
}

module.exports = Base;
