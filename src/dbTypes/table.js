'use strict';
const Base = require('./base');
const Index = require('./index');
const Column = require('./column');
const { stripIndents } = require('common-tags');
const { ensureType } = require('../util');
const InvalidSchemaError = require('../errors/InvalidSchemaError');

const privates = new WeakMap();

class Table extends Base {
  constructor(name) {
    super(name);
    const _private = privates.set(this, {}).get(this);
    _private.exposedIndices = null;
    _private.exposedColumns = null;
    _private.primaryKey = null;
  }

  get columns () {
    const _private = privates.get(this);
    if(!_private.exposedColumns) {
      _private.exposedColumns = Object.freeze(this.children.filter(e=>e.constructor===Column));
    }
    return _private.exposedColumns;
  }

  get indices () {
    const _private = privates.get(this);
    if(!_private.exposedIndices) {
      _private.exposedIndices = Object.freeze(this.children.filter(e=>e.constructor===Index));
    }
    return _private.exposedIndices;
  }

  get primaryKey () {
    const _private = privates.get(this);
    if(_private.primaryKey === null) _private.primaryKey = this.indices.find(e=>e.origin === 'pk');
    return _private.primaryKey;
  }

  add (obj) {
    ensureType(obj, [Column, Index]);
    super.add(obj);
  }

  get SQL() {
    this.verify();
    let columnStrings = this.columns.map(e=>e.SQL);
    columnStrings = columnStrings.concat(this.indices.filter(e=>e.origin.match(/^(?:u|pk)$/)).map(e=>e.SQL));
    return `CREATE TABLE IF NOT EXISTS \`${this.safeName}\` (${columnStrings.join(', ')})`;
  }

  invalidateCache() {
    super.invalidateCache();
    const _private = privates.get(this);
    _private.exposedIndices = null;
    _private.exposedIndices = null;
  }

  verify () {
    const errors = new Set();
    const WRONG_INSTANCE = Symbol('wrongInstance');
    let hasPk = false;

    for(let index of this.indices) {
      if(index.origin === 'pk') {
        if(hasPk) errors.add(`Multiple Public Key indices for table ${this.name}`);
        hasPk = true;
      }
      for(let column of index.columns) {
        let found = false;
        for(let tableColumn of this.columns) {
          if(tableColumn.name === column.name && tableColumn !== column) {
            if(!found) found = WRONG_INSTANCE;
          }
          if(tableColumn === column) found = true;
        }
        if(!found) {
          errors.add(`Index ${index.name} references column ${column.name} which does not exist in table ${this.name}`);
        } else if(found === WRONG_INSTANCE) {
          errors.add(stripIndents`Index ${index.name} references column ${column.name} which does not exist in table ${this.name}.
                      There is, however, another instance of Column with the same name in the table.
                      Make sure you use the same column instance in both the index and table`);
        }
      }
    }
    for(let column1 of this.columns) {
      for(let column2 of this.columns) {
        if(column1 === column2) continue;
        if(column1.name === column2.name) {
          errors.add(`Dupllicate column name for column ${column1.name} in table ${this.name}`);
        }
      }
    }
    if(errors.size) {
      throw new InvalidSchemaError('You have an error in your schema configuration', [...errors]);
    }
    return true;
  }
}

module.exports = Table;
