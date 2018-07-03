'use strict';
class InvalidSchemaError extends Error {
  constructor (message, errors) {
    super(message);
    Object.defineProperty(this, 'name', {value:this.constructor.name});
    this.errors = errors;
  }
}

module.exports = InvalidSchemaError;
