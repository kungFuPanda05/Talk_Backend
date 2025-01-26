// Seeder file to insert Parameters data into the Parameters table

module.exports = {
    async up(queryInterface, Sequelize) {
      const Parameters = [
        { name: "Unlimited Chat Rooms", createdAt: new Date(), updatedAt: new Date() },
        { name: "Allow matching Users rated 3 or above", createdAt: new Date(), updatedAt: new Date() },
        { name: "Allow matching Users rated 4 or above", createdAt: new Date(), updatedAt: new Date() },
        { name: "Allow matching Users rated 4.5 or above", createdAt: new Date(), updatedAt: new Date() },
      ];
  
      for (const param of Parameters) {
        const existing = await queryInterface.rawSelect(
          "Parameters",
          {
            where: { name: param.name },
          },
          ["id"]
        );
  
        if (!existing) {
          await queryInterface.bulkInsert("Parameters", [param], {});
        }
      }
    },
  
    async down(queryInterface, Sequelize) {
      await queryInterface.bulkDelete("Parameters", {
        name: [
          "Unlimited Chat Rooms",
          "Allow matching Users rated 3 or above",
          "Allow matching Users rated 4 or above",
          "Allow matching Users rated 4.5 or above",
        ],
      });
    },
  };
  