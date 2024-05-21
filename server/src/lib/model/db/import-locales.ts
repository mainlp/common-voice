import { getMySQLInstance } from './mysql';

const db = getMySQLInstance();

export async function importLocales() {
  await db.query('INSERT IGNORE INTO locales (name) VALUES ?', [['de'].map(l => [l])]);
  const updateQuery  = `
      UPDATE locales
      SET is_contributable = 1,
        is_translated = '1'
      WHERE name = 'de';
    `;
    
    await db.query(updateQuery);
}
