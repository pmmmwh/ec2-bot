const groupBy = (array, keyOrAccessor) => {
  const map = new Map();
  array.forEach((value) => {
    const key = keyOrAccessor instanceof Function ? keyOrAccessor(value) : value[keyOrAccessor];
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [value]);
    } else {
      collection.push(value);
    }
  });
  return map;
};

const startCase = (str) =>
  str
    .split('-')
    .map((subStr) => `${subStr[0].toUpperCase()}${subStr.slice(1)}`)
    .join(' ');

module.exports = { groupBy, startCase };
