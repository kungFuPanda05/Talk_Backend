'use strict';

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const bcrypt = require('bcrypt');
const emailValidator = require('email-validator');
const { QueryTypes, Sequelize } = require('sequelize');

const databaseConfigs = require('../config/config');

const MIGRATIONS_DIRECTORY = path.resolve(__dirname, '..', 'migrations');
const MIGRATION_TABLE = 'SequelizeMeta';
const MYSQL_LOCK_NAME = 'talk-backend-bootstrap-v1';
const MYSQL_LOCK_TIMEOUT_SECONDS = 60;

function requireEnv(name, environment = process.env) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readGender(name, fallback, environment = process.env) {
  const value = (environment[name] || fallback).trim().toUpperCase();

  if (!['M', 'F'].includes(value)) {
    throw new Error(`${name} must be either M or F`);
  }

  return value;
}

function readStartingCoins(environment = process.env) {
  const rawValue = environment.DEMO_STARTING_COINS?.trim() || '1000';
  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < 10) {
    throw new Error('DEMO_STARTING_COINS must be an integer of at least 10');
  }

  return value;
}

function validateAccount(account) {
  if (account.name.length > 255) {
    throw new Error(`${account.envPrefix}_NAME must be at most 255 characters`);
  }

  if (!emailValidator.validate(account.email) || account.email.length > 255) {
    throw new Error(`${account.envPrefix}_EMAIL must be a valid email address`);
  }

  if (account.password.length < 8) {
    throw new Error(`${account.envPrefix}_PASSWORD must contain at least 8 characters`);
  }
}

function readDemoAccounts(environment = process.env) {
  const accounts = [
    {
      envPrefix: 'DEMO_ADMIN',
      name: requireEnv('DEMO_ADMIN_NAME', environment),
      email: requireEnv('DEMO_ADMIN_EMAIL', environment).toLowerCase(),
      password: requireEnv('DEMO_ADMIN_PASSWORD', environment),
      gender: readGender('DEMO_ADMIN_GENDER', 'F', environment),
      isAdmin: true,
    },
    {
      envPrefix: 'DEMO_USER',
      name: requireEnv('DEMO_USER_NAME', environment),
      email: requireEnv('DEMO_USER_EMAIL', environment).toLowerCase(),
      password: requireEnv('DEMO_USER_PASSWORD', environment),
      gender: readGender('DEMO_USER_GENDER', 'M', environment),
      isAdmin: false,
    },
  ];

  accounts.forEach(validateAccount);

  if (accounts[0].email === accounts[1].email) {
    throw new Error('DEMO_ADMIN_EMAIL and DEMO_USER_EMAIL must be different');
  }

  const runtimeAdminEmail = requireEnv('ADMIN_EMAIL_ID', environment).toLowerCase();
  if (runtimeAdminEmail !== accounts[0].email) {
    throw new Error('ADMIN_EMAIL_ID must match DEMO_ADMIN_EMAIL');
  }

  const startingCoins = readStartingCoins(environment);
  return accounts.map((account) => ({ ...account, startingCoins }));
}

function createSequelize(environment = process.env) {
  const environmentName = environment.NODE_ENV || 'production';
  const config = databaseConfigs[environmentName];

  if (!config) {
    throw new Error(`No database configuration exists for NODE_ENV=${environmentName}`);
  }

  if (config.use_env_variable) {
    const connectionString = requireEnv(config.use_env_variable, environment);
    return new Sequelize(connectionString, { ...config, logging: false });
  }

  return new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false,
  });
}

function normalizeTableName(table) {
  if (typeof table === 'string') return table;
  if (table?.tableName) return table.tableName;
  if (table && typeof table === 'object') return Object.values(table)[0];
  return String(table);
}

async function listTableNames(queryInterface) {
  return (await queryInterface.showAllTables()).map(normalizeTableName);
}

function includesTable(tableNames, expectedName) {
  const normalizedExpectedName = expectedName.toLowerCase();
  return tableNames.some((name) => String(name).toLowerCase() === normalizedExpectedName);
}

function listMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIRECTORY)
    .filter((file) => file.endsWith('.js'))
    .sort((left, right) => left.localeCompare(right));
}

async function getAppliedMigrationNames(sequelize, queryInterface) {
  const tableNames = await listTableNames(queryInterface);
  if (!includesTable(tableNames, MIGRATION_TABLE)) return new Set();

  const quotedTable = queryInterface.queryGenerator.quoteTable(MIGRATION_TABLE);
  const rows = await sequelize.query(`SELECT name FROM ${quotedTable}`, {
    type: QueryTypes.SELECT,
  });

  return new Set(rows.map((row) => row.name));
}

async function getMigrationStatus(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const migrationFiles = listMigrationFiles();
  const appliedNames = await getAppliedMigrationNames(sequelize, queryInterface);

  return {
    migrationFiles,
    appliedNames,
    pendingFiles: migrationFiles.filter((file) => !appliedNames.has(file)),
  };
}

async function ensureMigrationTable(queryInterface) {
  const tableNames = await listTableNames(queryInterface);
  if (includesTable(tableNames, MIGRATION_TABLE)) return;

  await queryInterface.createTable(MIGRATION_TABLE, {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
  });
}

async function runPendingMigrations(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMigrationTable(queryInterface);

  const { pendingFiles } = await getMigrationStatus(sequelize);

  for (const file of pendingFiles) {
    const migrationPath = path.join(MIGRATIONS_DIRECTORY, file);
    const migration = require(migrationPath);

    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${file} does not export an up function`);
    }

    process.stdout.write(`Applying migration ${file}... `);
    await migration.up(queryInterface, Sequelize);
    await queryInterface.bulkInsert(MIGRATION_TABLE, [{ name: file }], {});
    process.stdout.write('done\n');
  }

  return pendingFiles.length;
}

async function passwordMatches(password, hash) {
  if (!hash) return false;

  try {
    return await bcrypt.compare(password, hash);
  } catch (_error) {
    return false;
  }
}

async function findAccountRow(sequelize, account, transaction) {
  const queryInterface = sequelize.getQueryInterface();
  const quotedTable = queryInterface.queryGenerator.quoteTable('Users');
  const quotedEmail = queryInterface.queryGenerator.quoteIdentifier('email');
  const rows = await sequelize.query(
    `SELECT id, name, email, password, isAdmin, gender, coins, rating, Online, deletedAt
     FROM ${quotedTable}
     WHERE LOWER(${quotedEmail}) = :email
     LIMIT 1`,
    {
      replacements: { email: account.email },
      transaction,
      type: QueryTypes.SELECT,
    },
  );

  return rows[0] || null;
}

async function inspectAccount(sequelize, account, transaction) {
  const row = await findAccountRow(sequelize, account, transaction);
  if (!row) return { row: null, updates: {}, passwordNeedsUpdate: true };

  const updates = {};

  if (row.name !== account.name) updates.name = account.name;
  if (row.email !== account.email) updates.email = account.email;
  if (row.gender !== account.gender) updates.gender = account.gender;
  if (Boolean(row.isAdmin) !== account.isAdmin) updates.isAdmin = account.isAdmin;
  if (row.deletedAt !== null) updates.deletedAt = null;
  if (row.coins === null || Number(row.coins) < account.startingCoins) {
    updates.coins = account.startingCoins;
  }
  if (row.rating === null) updates.rating = 0;
  if (row.Online === null) updates.Online = 0;

  return {
    row,
    updates,
    passwordNeedsUpdate: !(await passwordMatches(account.password, row.password)),
  };
}

async function reconcileAccount(sequelize, account, transaction) {
  const queryInterface = sequelize.getQueryInterface();
  const inspection = await inspectAccount(sequelize, account, transaction);
  const now = new Date();

  if (!inspection.row) {
    await queryInterface.bulkInsert(
      'Users',
      [
        {
          name: account.name,
          email: account.email,
          password: await bcrypt.hash(account.password, 10),
          isAdmin: account.isAdmin,
          gender: account.gender,
          pic: null,
          Online: 0,
          coins: account.startingCoins,
          rating: 0,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ],
      { transaction },
    );

    return 'created';
  }

  const updates = { ...inspection.updates };
  if (inspection.passwordNeedsUpdate) {
    updates.password = await bcrypt.hash(account.password, 10);
  }

  if (Object.keys(updates).length === 0) return 'unchanged';

  updates.updatedAt = now;
  await queryInterface.bulkUpdate('Users', updates, { id: inspection.row.id }, { transaction });
  return 'updated';
}

async function reconcileDemoAccounts(sequelize, accounts, transaction) {
  const summary = { created: 0, updated: 0, unchanged: 0 };

  for (const account of accounts) {
    const result = await reconcileAccount(sequelize, account, transaction);
    summary[result] += 1;
  }

  return summary;
}

async function inspectDemoAccountDrift(sequelize, accounts) {
  const tableNames = await listTableNames(sequelize.getQueryInterface());
  if (!includesTable(tableNames, 'Users')) return accounts.length;

  let driftCount = 0;
  for (const account of accounts) {
    const inspection = await inspectAccount(sequelize, account);
    if (
      !inspection.row ||
      inspection.passwordNeedsUpdate ||
      Object.keys(inspection.updates).length > 0
    ) {
      driftCount += 1;
    }
  }

  return driftCount;
}

async function acquireBootstrapLock(sequelize) {
  if (!['mysql', 'mariadb'].includes(sequelize.getDialect())) return false;

  const rows = await sequelize.query(
    'SELECT GET_LOCK(:lockName, :timeoutSeconds) AS acquired',
    {
      replacements: {
        lockName: MYSQL_LOCK_NAME,
        timeoutSeconds: MYSQL_LOCK_TIMEOUT_SECONDS,
      },
      type: QueryTypes.SELECT,
    },
  );

  if (Number(rows[0]?.acquired) !== 1) {
    throw new Error('Could not acquire the database bootstrap lock');
  }

  return true;
}

async function releaseBootstrapLock(sequelize, lockWasAcquired) {
  if (!lockWasAcquired) return;

  await sequelize.query('SELECT RELEASE_LOCK(:lockName)', {
    replacements: { lockName: MYSQL_LOCK_NAME },
    type: QueryTypes.SELECT,
  });
}

async function verifyReconciliationIdempotency(sequelize, accounts) {
  const transaction = await sequelize.transaction();

  try {
    await reconcileDemoAccounts(sequelize, accounts, transaction);
    const secondRun = await reconcileDemoAccounts(sequelize, accounts, transaction);

    if (secondRun.created !== 0 || secondRun.updated !== 0) {
      throw new Error('Demo account reconciliation was not idempotent');
    }

    await transaction.rollback();
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

async function main() {
  const options = new Set(process.argv.slice(2));
  const allowedOptions = new Set(['--check', '--verify-idempotency']);
  const unknownOptions = [...options].filter((option) => !allowedOptions.has(option));

  if (unknownOptions.length > 0 || options.size > 1) {
    throw new Error('Usage: node scripts/bootstrap-production.js [--check|--verify-idempotency]');
  }

  const accounts = readDemoAccounts();
  const sequelize = createSequelize();
  let lockWasAcquired = false;

  try {
    await sequelize.authenticate();

    if (options.has('--check')) {
      const migrationStatus = await getMigrationStatus(sequelize);
      const accountDriftCount = await inspectDemoAccountDrift(sequelize, accounts);

      console.log(`Pending migrations: ${migrationStatus.pendingFiles.length}`);
      console.log(`Demo accounts requiring reconciliation: ${accountDriftCount}`);

      if (migrationStatus.pendingFiles.length > 0 || accountDriftCount > 0) {
        process.exitCode = 1;
      }
      return;
    }

    lockWasAcquired = await acquireBootstrapLock(sequelize);

    if (options.has('--verify-idempotency')) {
      const migrationStatus = await getMigrationStatus(sequelize);
      if (migrationStatus.pendingFiles.length > 0) {
        throw new Error('Apply pending migrations before verifying account reconciliation');
      }

      await verifyReconciliationIdempotency(sequelize, accounts);
      console.log('Demo account reconciliation is idempotent; verification changes were rolled back.');
      return;
    }

    const migrationCount = await runPendingMigrations(sequelize);
    const accountSummary = await sequelize.transaction((transaction) =>
      reconcileDemoAccounts(sequelize, accounts, transaction),
    );

    console.log(`Applied migrations: ${migrationCount}`);
    console.log(
      `Demo accounts: ${accountSummary.created} created, ${accountSummary.updated} updated, ${accountSummary.unchanged} unchanged.`,
    );
    console.log('Production database bootstrap complete.');
  } finally {
    try {
      await releaseBootstrapLock(sequelize, lockWasAcquired);
    } finally {
      await sequelize.close();
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Database bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  createSequelize,
  getMigrationStatus,
  inspectDemoAccountDrift,
  readDemoAccounts,
  reconcileDemoAccounts,
  verifyReconciliationIdempotency,
};
