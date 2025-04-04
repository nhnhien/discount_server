'use strict';
 
 export default {
   async up(queryInterface, Sequelize) {
     await queryInterface.addColumn('quantity_break', 'product_id', {
       type: Sequelize.INTEGER,
       allowNull: true,
       references: {
         model: 'product',
         key: 'id',
       },
       onDelete: 'CASCADE',
     });
 
     await queryInterface.addColumn('quantity_break', 'variant_id', {
       type: Sequelize.INTEGER,
       allowNull: true,
       references: {
         model: 'variant',
         key: 'id',
       },
       onDelete: 'CASCADE',
     });
   },
 
   async down(queryInterface) {
     await queryInterface.removeColumn('quantity_break', 'variant_id');
     await queryInterface.removeColumn('quantity_break', 'product_id');
   },
 };