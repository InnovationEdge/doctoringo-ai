/**
 * Query string helper — RFC 1738 stringification with bracket array notation.
 * Implemented without the `qs` package to keep deps minimal.
 */

type Primitive = string | number | boolean | null | undefined;
type ParamValue = Primitive | Primitive[] | Record<string, Primitive | Primitive[]>;
type ParamMap = Record<string, ParamValue>;

interface StringifyOptions {
  addQueryPrefix?: boolean;
  arrayFormat?: 'brackets' | 'comma' | 'repeat';
  sort?: ((a: string, b: string) => number) | false;
}

const encodeRFC1738 = (value: string): string =>
  encodeURIComponent(value).replace(/%20/g, '+');

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const flattenEntries = (params: ParamMap): Array<[string, Primitive | Primitive[]]> => {
  const out: Array<[string, Primitive | Primitive[]]> = [];
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    if (isPlainObject(raw)) {
      for (const [innerKey, innerVal] of Object.entries(raw)) {
        out.push([`${key}[${innerKey}]`, innerVal as Primitive | Primitive[]]);
      }
    } else {
      out.push([key, raw as Primitive | Primitive[]]);
    }
  }
  return out;
};

export const stringify = (
  params: unknown,
  options: StringifyOptions = {},
): string => {
  if (!isPlainObject(params)) return '';

  const {
    addQueryPrefix = true,
    arrayFormat = 'brackets',
    sort = (a: string, b: string) => a.localeCompare(b),
  } = options;

  const entries = flattenEntries(params as ParamMap);
  if (sort) entries.sort(([a], [b]) => sort(a, b));

  const parts: string[] = [];
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const filtered = value.filter((v) => v !== undefined && v !== null) as Primitive[];
      if (arrayFormat === 'comma') {
        parts.push(`${encodeRFC1738(key)}=${encodeRFC1738(filtered.join(','))}`);
      } else if (arrayFormat === 'repeat') {
        for (const v of filtered) parts.push(`${encodeRFC1738(key)}=${encodeRFC1738(String(v))}`);
      } else {
        for (const v of filtered) parts.push(`${encodeRFC1738(`${key}[]`)}=${encodeRFC1738(String(v))}`);
      }
    } else {
      parts.push(`${encodeRFC1738(key)}=${encodeRFC1738(String(value))}`);
    }
  }

  const query = parts.join('&');
  if (!query) return '';
  return addQueryPrefix ? `?${query}` : query;
};

export default { stringify };
