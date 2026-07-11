export function sqlList(values) {
  return values.map((value) => `'${String(value).replaceAll("'", "''")}'`).join(', ')
}
