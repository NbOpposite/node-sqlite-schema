'use strict';
const sqlite = require('sqlite');
const Table = require('./dbTypes/table');
const Column = require('./dbTypes/column');
const Index = require('./dbTypes/index');

(async () => {
  const db = await sqlite.open('./main.sqlite', { Promise });
  const tables = await Promise.all((await db.all('SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE "sqlite_%"', 'table')).map(async e => {
    const table = new Table(e.name);
    (await db.all('PRAGMA table_info(`'+table.safeName+'`)')).forEach(e=>{
      const column = new Column(e.name, e.type);
      column.isNull = !e.notnull;
      column.defaultValue = e.dflt_value;
      table.add(column);
    });
    await Promise.all((await db.all('PRAGMA index_list(`'+table.safeName+'`)')).map(async e=>{
      const index = new Index(e.name, e.origin);
      table.add(index);
      index.isPartial = e.partial;
      index.isUnique = e.unique;

      await Promise.all((await db.all('PRAGMA index_info(`'+index.safeName+'`)')).map(async e=>{
        const column = table.get(e.name, Column);
        if(!column) throw new Error(`Invalid column (${e.name}) in index ${index.name}`);
        index.register(column);
      }));
    }));

    return table;
  }));
  console.log(tables.map(e=>{
    try { return e.SQL; } catch (e) { console.error(e); }
  }).join('\n\n'));

})().catch(console.error);
