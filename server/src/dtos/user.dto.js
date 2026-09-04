const userDTO = (user) => {
  return {
    id: user._id,

    name: user.name,

    username: user.username,

    email: user.email,

    profilePhoto: user.profilePhoto,

    role: user.role,
  };
};

module.exports = userDTO;