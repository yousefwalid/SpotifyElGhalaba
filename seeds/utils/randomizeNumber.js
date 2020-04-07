module.exports = (from, to, count, different) => {
  if (count > to - from + 1 && different)
    throw Error(
      'different cannot be set if the number of elements is bigger than the number of range values'
    );
  if (count) {
    const numbers = [];
    let i;
    for (i = 0; i < count; i += 1) {
      const randomNum = Math.floor(Math.random() * (to - from + 1)) + from;
      if (different) {
        if (numbers.includes(randomNum)) {
          i -= 1;
          // eslint-disable-next-line no-continue
          continue;
        }
      }
      numbers.push(randomNum);
    }
    return numbers;
  }
  return Math.floor(Math.random() * (to - from + 1)) + from;
};
