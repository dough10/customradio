module.exports = ({user}) => {
  const adminID = process.env.ADMIN_ID;
  if (!adminID || !user) return false;
  return adminID === user.id;
};