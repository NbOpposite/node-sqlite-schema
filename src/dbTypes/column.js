'use strict';
const Base = require('./base');

class Column extends Base {
  constructor(name, type, props) {
    let _type = type;
    let _null = false;
    let _default = null;

    props = Object.assign({
      type:  {
        enumerable: true,
        get() {
          return _type;
        },
        set(val) {
          _type = val;
        }
      },
      isNull: {
        enumerable: true,
        get() {
          return _null;
        },
        set(val) {
          _null = !!val;
        }
      },
      defaultValue: {
        enumerable: true,
        get() {
          return _default;
        },
        set(val) {
          _default = val;
        }
      },
    }, props);

    super(name, props);
  }

  add () {
    throw Error('Column cannot have any children');
  }

  get SQL() {
    const elements = [`\`${this.safeName}\``];
    if(this.type) elements.push(this.type);
    if(!this.isNull) elements.push('NOT NULL');
    return elements.join(' ');
  }
}

module.exports = Column;
