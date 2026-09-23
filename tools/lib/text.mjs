/**
 * Matnni qiyoslashga tayyorlash: bo'shliqlar tashlanadi, tirnoq/xetlar
 * birlashtiriladi. Kitobdagi tipografik belgilar (ʻ ʼ ' ` “ ” va nodavriy
 * skanerda chiqqan lotin/kirill o'xshashlari) bilan biz yozgan variantlar
 * shunda bir xil ko'rinishga keladi.
 */
export function norm(s) {
  return String(s)
    .replace(/[\u02bb\u02bc\u02be\u2018\u2019\u201a\u00b4\u0060\u0027]/g, "'")
    .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    // skanerda kirillcha ko'rinishda chiqqan lotin harflari
    .replace(/[а]/g, 'a')
    .replace(/[е]/g, 'e')
    .replace(/[о]/g, 'o')
    .replace(/[с]/g, 'c')
    .replace(/[р]/g, 'p')
    .replace(/[у]/g, 'y')
    .replace(/[х]/g, 'x')
    .replace(/[к]/g, 'k')
    .replace(/[т]/g, 't')
    .replace(/[м]/g, 'm')
    .replace(/[н]/g, 'h')
    .replace(/[в]/g, 'v')
    .replace(/[ѕ]/g, 's')
    .replace(/[\u0406\u0407]/g, 'i')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

/** Sahifalar/ustunlar ro'yxatidan bitta qidiruv matni (hay) yasaydi. */
export function flatten(pages) {
  return norm(pages.flatMap((p) => p.columns.flat()).join(''));
}
