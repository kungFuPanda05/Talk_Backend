const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt'); // For password hashing (optional but recommended)

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const Users = [];
    const now = new Date();

    const femaleNames = ['Aisha', 'Priya', 'Sneha', 'Nisha', 'Pooja', 'Riya', 'Anjali', 'Divya', 'Simran', 'Kavita', 'Meera', 'Neha', 'Shweta', 'Tanvi', 'Isha', 'Preeti', 'Vidya', 'Sarika'];
    const maleNames = ['Amit', 'Rahul'];

    for (let i = 1; i <= 20; i++) {
      const isMale = i <= 2; // Only 2 accounts are male
      const email = `bot${i}@bot.com`;

      // Check if email already exists
      const existingUser = await queryInterface.sequelize.query(
        `SELECT * FROM Users WHERE email = ?`,
        { replacements: [email], type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (existingUser.length === 0) {
        Users.push({
          name: isMale ? maleNames[i - 1] : femaleNames[i - 3], // Assign names
          gender: isMale ? 'M' : 'F',
          email: email,
          password: await bcrypt.hash(`password${i}`, 10), // Hash passwords
          isAdmin: 0,
          pic: null, // Picture is null
          coins: Math.floor(Math.random() * 1000), // Random coins between 0-1000
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          Online: 0, // Default offline
        });
      }
    }

    // Insert the generated data into the Users table
    if (Users.length > 0) {
      await queryInterface.bulkInsert('Users', Users, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the inserted data
    await queryInterface.bulkDelete('Users', { email: { [Sequelize.Op.like]: 'bot%@bot.com' } }, {});
  },
};
