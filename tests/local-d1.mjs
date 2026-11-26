import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

export function localD1() {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0000_reading_quota.sql',import.meta.url),'utf8'));
  return {
    prepare(sql) {
      const stmt=sqlite.prepare(sql);
      const bind=(...args)=>({first:async()=>stmt.get(...args) ?? null,run:()=>stmt.run(...args)});
      return {...bind(),bind};
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {for (const statement of statements) statement.run();sqlite.exec('COMMIT');}
      catch (error) {sqlite.exec('ROLLBACK');throw error;}
    },
    close:()=>sqlite.close()
  };
}
