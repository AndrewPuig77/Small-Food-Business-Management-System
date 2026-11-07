// Safe SQL building.
//
// Use the `sql` tag for every query that includes a value:
//
//   db.exec(sql`SELECT * FROM users WHERE id = ${userId}`)
//
// Each ${value} becomes a `?` placeholder and is bound separately, so values
// can never change the structure of the query. A nested sql`...` fragment is
// inlined (its placeholders and params are merged), which lets queries be
// built up conditionally:
//
//   let where = sql`WHERE business_id = ${businessId}`;
//   if (status) where = sql`${where} AND status = ${status}`;
//
// sql.raw() inserts trusted text verbatim. Only use it for identifiers that
// come from a fixed whitelist in code, never for user input.

class Sql {
  constructor(text, params) {
    this.text = text;
    this.params = params;
  }
}

const normalize = (value) => {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === 'object') {
    throw new TypeError('Cannot bind an object as a SQL parameter');
  }
  return value;
};

const sql = (strings, ...values) => {
  let text = strings[0];
  const params = [];
  values.forEach((value, i) => {
    if (value instanceof Sql) {
      text += value.text;
      params.push(...value.params);
    } else {
      text += '?';
      params.push(normalize(value));
    }
    text += strings[i + 1];
  });
  return new Sql(text, params);
};

sql.raw = (text) => new Sql(String(text), []);

sql.join = (parts, separator = ', ') => {
  const list = parts.map((p) => (p instanceof Sql ? p : sql`${p}`));
  return new Sql(
    list.map((p) => p.text).join(separator),
    list.flatMap((p) => p.params)
  );
};

sql.empty = new Sql('', []);

module.exports = { sql, Sql };
