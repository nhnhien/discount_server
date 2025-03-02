import sequelize from '../config/database';
import setUpAssociations from './associations';
import Role from './role';
import User from './user';

setUpAssociations();

const models = { User, Role };

export { sequelize };
export default models;