module.exports = ({user}) => {
  console.log(user?.metadata.role === 'admin');
  const adminID = process.env.ADMIN_ID;
  if (!adminID || !user) return false;
  return adminID === user.id;
};