module.exports = ({user}) => {
  console.log(user, user?.metadata);
  const adminID = process.env.ADMIN_ID;
  if (!adminID || !user) return false;
  return adminID === user.id;
};