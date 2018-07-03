'use strict';
const Base = require('./base');
const Column = require('./column');
const InvalidSchemaError = require('../errors/InvalidSchemaError');
const { findIndices, ensureType } = require('../util');
const privates = new WeakMap();

class Index extends Base {
  constructor(name, origin) {
    super(name);
    const _private = privates.set(this, {}).get(this);
    _private.origin = origin;
    _private.unique = false;
    _private.partial = false;
    _private.columns = new Set();
    _private.exposedColumns = null;
  }

  get origin () {
    return privates.get(this).origin;
  }
  set origin (val) {
    privates.get(this).origin = val;
  }

  get isPartial () {
    return privates.get(this).partial;
  }

  set isPartial (val) {
    privates.get(this).partial = !!val;
  }

  get isUnique () {
    return privates.get(this).isUnique;
  }
  set isUnique (val) {
    privates.get(this).isUnique = val;
  }

  get columns () {
    const _private = privates.get(this);
    if(!this.parent) throw new InvalidSchemaError('Index is malconfigured, it does not belong to a table');
    if(!_private.exposedColumns) {
      const exposedColumns = Object.freeze([..._private.columns]
        .map(e=>this.parent.columns
          .find(c=>e.name === c.name)));
      if(exposedColumns.includes(undefined)) {
        const indices = findIndices(exposedColumns, undefined);
        // TODO: finish implementing check for missing columns in index parent table
        console.log(indices);
        throw new InvalidSchemaError('Index is malconfigured, some columns are missing from the parent table');
      }
      _private.exposedColumns = exposedColumns;
    }
    return _private.exposedColumns;
  }

  add () {
    throw new Error('Indices cannot have any children. Use Index#register(Column) to register a column to this index');
  }

  register (column) {
    ensureType(column, Column);
    if(column.parent !== this.parent || this.parent === null) {
      throw new InvalidSchemaError('Cannot add column that is not part of the parent table');
    }
  }

  get SQL() {
    switch(this.origin) {
    case 'c':
      throw Error('not yet implemented');
    case 'pk':
      return `PUBLIC KEY(${this.columns.map(e=>'`'+e.safeName+'`').join(', ')})`;
    case 'u':
      return `UNIQUE(${this.columns.map(e=>'`'+e.safeName+'`').join(', ')})`;
    }
    throw new InvalidSchemaError('This index is malconfigured, origin is invalid.');
  }
}

module.exports = Index;
