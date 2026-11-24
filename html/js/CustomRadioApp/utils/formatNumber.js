export default (num) => {
  num = Number(num);
  return num >= 1000 ? num.toLocaleString("en-US") : num;
}