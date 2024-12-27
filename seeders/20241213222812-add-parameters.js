// Seeder file to insert parameters data into the parameters table

module.exports = {
    async up(queryInterface, Sequelize) {
      const parameters = [
        { name: "Unlimited Chat Rooms", createdAt: new Date(), updatedAt: new Date() },
        { name: "Allow matching Users rated 3 or above", createdAt: new Date(), updatedAt: new Date() },
        { name: "Allow matching Users rated 4 or above", createdAt: new Date(), updatedAt: new Date() },
        { name: "Allow matching Users rated 4.5 or above", createdAt: new Date(), updatedAt: new Date() },
      ];
  
      for (const param of parameters) {
        const existing = await queryInterface.rawSelect(
          "parameters",
          {
            where: { name: param.name },
          },
          ["id"]
        );
  
        if (!existing) {
          await queryInterface.bulkInsert("parameters", [param], {});
        }
      }
    },
  
    async down(queryInterface, Sequelize) {
      await queryInterface.bulkDelete("parameters", {
        name: [
          "Unlimited Chat Rooms",
          "Allow matching Users rated 3 or above",
          "Allow matching Users rated 4 or above",
          "Allow matching Users rated 4.5 or above",
        ],
      });
    },
  };
  