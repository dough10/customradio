module.exports = ({name, url}) => {
  return `${name.replace(/,/g, '')}, ${url}`;
}