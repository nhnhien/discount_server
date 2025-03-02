import Role from './role';
import User from './user';

const setUpAssociations = () => {
  Role.hasMany(User, {
    foreignKey: 'role_id',
    onDelete: 'CASCADE',
  });
  User.belongsTo(Role, {
    foreignKey: 'role_id',
  });
};

export default setUpAssociations;