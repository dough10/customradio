module.exports = (ip) => {
  if (!ip) return ip;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return ip.replace(/\.\d+$/, '.0');
  }
  if (ip.includes('::ffff:')) {
    const v4 = ip.split('::ffff:')[1];
    return '::ffff:' + v4.replace(/\.\d+$/, '.0');
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  return ip;
}