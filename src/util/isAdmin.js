module.exports = ({user}) => {
  if (!user) return false;
  return user.metadata.role === 'admin'
};