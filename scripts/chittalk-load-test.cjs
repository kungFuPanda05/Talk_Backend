#!/usr/bin/env node

'use strict';

const fs = require('fs');
const { performance } = require('perf_hooks');
const { io } = require('socket.io-client');

const DEFAULTS = {
  baseUrl: 'http://127.0.0.1:4100',
  users: 10,
  cycles: 2,
  messages: 2,
  rampMs: 1000,
  setupConcurrency: 8,
  loginConcurrency: 32,
  matchTimeoutMs: 10000,
  messageTimeoutMs: 5000,
  leaveTimeoutMs: 1500,
  reconnectRate: 0.2,
  reconnectDelayMinMs: 100,
  reconnectDelayMaxMs: 400,
  settleMs: 250,
  emailPrefix: 'chittalk-load',
  password: 'LoadTest-2026!',
  seed: 20260814,
  jsonPath: null,
  allowNonLoopback: false,
};

function usage() {
  return `ChitTalk local Socket.IO load test

Usage:
  node scripts/chittalk-load-test.cjs [options]

Options:
  --base-url URL              Target URL (default http://127.0.0.1:4100)
  --users N                   Even number of virtual users (default 10)
  --cycles N                  Match/chat/leave cycles per user (default 2)
  --messages N                Messages sent by each user per cycle (default 2)
  --ramp-ms N                 Socket connection ramp duration (default 1000)
  --setup-concurrency N       Registration concurrency (default 8)
  --login-concurrency N       Login concurrency (default 32)
  --match-timeout-ms N        Per-cycle match timeout (default 10000)
  --message-timeout-ms N      Per-cycle delivery timeout (default 5000)
  --reconnect-rate N          Hard-disconnect fraction, 0..1 (default 0.2)
  --email-prefix TEXT         Deterministic account prefix
  --password TEXT             Test account password (minimum 8 characters)
  --seed N                    Deterministic random seed
  --json PATH                 Write the full result as JSON
  --allow-non-loopback        Explicitly permit a non-local target (dangerous)
  --help                      Show this help
`;
}

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  const valueOptions = {
    '--base-url': ['baseUrl', String],
    '--users': ['users', Number],
    '--cycles': ['cycles', Number],
    '--messages': ['messages', Number],
    '--ramp-ms': ['rampMs', Number],
    '--setup-concurrency': ['setupConcurrency', Number],
    '--login-concurrency': ['loginConcurrency', Number],
    '--match-timeout-ms': ['matchTimeoutMs', Number],
    '--message-timeout-ms': ['messageTimeoutMs', Number],
    '--reconnect-rate': ['reconnectRate', Number],
    '--email-prefix': ['emailPrefix', String],
    '--password': ['password', String],
    '--seed': ['seed', Number],
    '--json': ['jsonPath', String],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') {
      process.stdout.write(usage());
      process.exit(0);
    }
    if (argument === '--allow-non-loopback') {
      options.allowNonLoopback = true;
      continue;
    }
    const definition = valueOptions[argument];
    if (!definition) throw new Error(`Unknown option: ${argument}`);
    const rawValue = argv[index + 1];
    if (rawValue === undefined) throw new Error(`Missing value for ${argument}`);
    options[definition[0]] = definition[1](rawValue);
    index += 1;
  }

  const positiveIntegers = [
    'users',
    'cycles',
    'messages',
    'setupConcurrency',
    'loginConcurrency',
    'matchTimeoutMs',
    'messageTimeoutMs',
  ];
  for (const key of positiveIntegers) {
    if (!Number.isSafeInteger(options[key]) || options[key] < 1) {
      throw new Error(`${key} must be a positive integer`);
    }
  }
  if (options.users % 2 !== 0) throw new Error('users must be even');
  if (!Number.isFinite(options.rampMs) || options.rampMs < 0) {
    throw new Error('rampMs must be zero or greater');
  }
  if (!Number.isFinite(options.reconnectRate) || options.reconnectRate < 0 || options.reconnectRate > 1) {
    throw new Error('reconnectRate must be between 0 and 1');
  }
  if (options.password.length < 8) throw new Error('password must contain at least 8 characters');
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/i.test(options.emailPrefix)) {
    throw new Error('emailPrefix must contain only letters, digits, and hyphens');
  }

  const target = new URL(options.baseUrl);
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('baseUrl must use http or https');
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
  if (!loopbackHosts.has(target.hostname) && !options.allowNonLoopback) {
    throw new Error(
      `Refusing non-loopback target ${target.hostname}. This harness is local-only unless --allow-non-loopback is explicitly supplied.`,
    );
  }
  options.baseUrl = target.origin;
  return options;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted, quantile) {
  if (sorted.length === 0) return null;
  const position = (sorted.length - 1) * quantile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function summarize(values) {
  const clean = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (clean.length === 0) {
    return { count: 0, min: null, mean: null, p50: null, p95: null, p99: null, max: null };
  }
  const round = (value) => Math.round(value * 100) / 100;
  return {
    count: clean.length,
    min: round(clean[0]),
    mean: round(clean.reduce((sum, value) => sum + value, 0) / clean.length),
    p50: round(percentile(clean, 0.5)),
    p95: round(percentile(clean, 0.95)),
    p99: round(percentile(clean, 0.99)),
    max: round(clean[clean.length - 1]),
  };
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function waitFor(predicate, timeoutMs, intervalMs = 20) {
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeoutMs) {
    if (predicate()) return true;
    await sleep(intervalMs);
  }
  return Boolean(predicate());
}

async function requestJson(baseUrl, route, options = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    signal: AbortSignal.timeout(options.timeoutMs || 15000),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_error) {
    body = { raw: text.slice(0, 500) };
  }
  return {
    response,
    body,
    durationMs: performance.now() - startedAt,
  };
}

function errorText(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  try {
    return JSON.stringify(error);
  } catch (_error) {
    return String(error);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const random = createRandom(options.seed);
  const startedAt = new Date();
  const errors = [];
  const timings = {
    registrationMs: [],
    loginMs: [],
    identityMs: [],
    socketConnectMs: [],
    matchMs: [],
    messageDeliveryMs: [],
    leaveNoticeMs: [],
    reconnectMs: [],
    healthMs: [],
  };
  const counts = {
    provisionCreated: 0,
    provisionExisting: 0,
    provisionFailed: 0,
    loginSucceeded: 0,
    loginFailed: 0,
    socketConnectSucceeded: 0,
    socketConnectFailed: 0,
    matchEvents: 0,
    duplicateMatchEvents: 0,
    invalidMatches: 0,
    messagesSent: 0,
    uniqueDeliveries: 0,
    duplicateDeliveries: 0,
    wrongRoomDeliveries: 0,
    missingDeliveries: 0,
    leaveNotices: 0,
    leaveNoticeTimeouts: 0,
    hardDisconnects: 0,
    reconnectSucceeded: 0,
    reconnectFailed: 0,
    unexpectedDisconnects: 0,
    unexpectedUserLeftEvents: 0,
    serverSocketErrors: 0,
    healthSucceeded: 0,
    healthFailed: 0,
  };

  const users = Array.from({ length: options.users }, (_, index) => ({
    index,
    name: `Load User ${String(index + 1).padStart(4, '0')}`,
    gender: index % 2 === 0 ? 'M' : 'F',
    email: `${options.emailPrefix}-${String(index + 1).padStart(4, '0')}@example.com`,
    password: options.password,
    token: null,
    selfId: null,
    socket: null,
    connected: false,
    intentionalDisconnect: false,
    state: 'created',
    currentRoom: null,
    roomUsers: [],
    joinStartedAt: null,
    leaveProbe: null,
  }));

  process.stdout.write(
    `\nChitTalk local load test: ${options.users} users, ${options.cycles} cycles, ${options.messages} messages/user/cycle\n`,
  );
  process.stdout.write(`Target: ${options.baseUrl}\n`);

  const health = await requestJson(options.baseUrl, '/health');
  if (!health.response.ok || health.body?.status !== 'ok') {
    throw new Error(`Target health check failed: HTTP ${health.response.status} ${JSON.stringify(health.body)}`);
  }

  const provisionStarted = performance.now();
  await mapWithConcurrency(users, options.setupConcurrency, async (user) => {
    try {
      const result = await requestJson(options.baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          gender: user.gender,
          email: user.email,
          password: user.password,
        }),
      });
      timings.registrationMs.push(result.durationMs);
      if (result.response.ok) {
        counts.provisionCreated += 1;
      } else if (result.response.status === 409) {
        counts.provisionExisting += 1;
      } else {
        counts.provisionFailed += 1;
        errors.push({ stage: 'provision', user: user.index, status: result.response.status, body: result.body });
      }
    } catch (error) {
      counts.provisionFailed += 1;
      errors.push({ stage: 'provision', user: user.index, error: errorText(error) });
    }
  });
  const provisionDurationMs = performance.now() - provisionStarted;
  if (counts.provisionFailed > 0) throw new Error(`${counts.provisionFailed} users failed provisioning`);

  const loginStarted = performance.now();
  await mapWithConcurrency(users, options.loginConcurrency, async (user) => {
    try {
      const login = await requestJson(options.baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });
      timings.loginMs.push(login.durationMs);
      if (!login.response.ok || !login.body?.token) {
        counts.loginFailed += 1;
        errors.push({ stage: 'login', user: user.index, status: login.response.status, body: login.body });
        return;
      }
      user.token = login.body.token;
      counts.loginSucceeded += 1;

      const identity = await requestJson(options.baseUrl, '/api/user/getId', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      timings.identityMs.push(identity.durationMs);
      if (!identity.response.ok || !Number.isFinite(Number(identity.body?.result))) {
        counts.loginFailed += 1;
        counts.loginSucceeded -= 1;
        errors.push({ stage: 'identity', user: user.index, status: identity.response.status, body: identity.body });
        user.token = null;
        return;
      }
      user.selfId = Number(identity.body.result);
    } catch (error) {
      counts.loginFailed += 1;
      errors.push({ stage: 'login', user: user.index, error: errorText(error) });
    }
  });
  const loginDurationMs = performance.now() - loginStarted;
  if (counts.loginFailed > 0) throw new Error(`${counts.loginFailed} users failed login/identity lookup`);

  const pendingMessages = new Map();
  const cycleResults = [];

  function attachSocket(user) {
    const socket = io(options.baseUrl, {
      autoConnect: false,
      forceNew: true,
      reconnection: false,
      timeout: 10000,
      transports: ['websocket'],
      extraHeaders: { Authorization: `Bearer ${user.token}` },
    });
    user.socket = socket;

    socket.on('strangers-connected', (event) => {
      if (user.state !== 'searching') {
        counts.duplicateMatchEvents += 1;
        return;
      }
      const eventUsers = Array.isArray(event?.users) ? event.users : [];
      const ids = eventUsers.map((entry) => Number(entry.id));
      const valid =
        event?.success === true &&
        typeof event.roomId === 'string' &&
        event.roomId.length > 0 &&
        ids.length === 2 &&
        new Set(ids).size === 2 &&
        ids.includes(user.selfId);
      if (!valid) {
        counts.invalidMatches += 1;
        errors.push({ stage: 'match-validation', user: user.index, event });
        return;
      }
      user.state = 'matched';
      user.currentRoom = event.roomId;
      user.roomUsers = ids;
      counts.matchEvents += 1;
      timings.matchMs.push(performance.now() - user.joinStartedAt);
    });

    socket.on('message', (event) => {
      const pending = pendingMessages.get(event?.identityKey);
      if (!pending) return;
      if (event.randomRoomId !== pending.roomId) counts.wrongRoomDeliveries += 1;
      if (pending.receivers.has(user.selfId)) {
        counts.duplicateDeliveries += 1;
        return;
      }
      pending.receivers.add(user.selfId);
      counts.uniqueDeliveries += 1;
      timings.messageDeliveryMs.push(performance.now() - pending.sentAt);
    });

    socket.on('user-left', () => {
      const probe = user.leaveProbe;
      if (!probe || probe.recorded) {
        counts.unexpectedUserLeftEvents += 1;
        return;
      }
      probe.recorded = true;
      counts.leaveNotices += 1;
      timings.leaveNoticeMs.push(performance.now() - probe.startedAt);
    });

    socket.on('error', (error) => {
      counts.serverSocketErrors += 1;
      errors.push({ stage: 'socket-error', user: user.index, error });
    });

    socket.on('disconnect', (reason) => {
      user.connected = false;
      if (!user.intentionalDisconnect) {
        counts.unexpectedDisconnects += 1;
        errors.push({ stage: 'unexpected-disconnect', user: user.index, reason });
      }
    });
  }

  async function connectUser(user, reconnect = false) {
    if (!user.socket) attachSocket(user);
    const started = performance.now();
    user.intentionalDisconnect = false;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (success, error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        user.socket.off('connect', onConnect);
        user.socket.off('connect_error', onError);
        const elapsed = performance.now() - started;
        if (reconnect) timings.reconnectMs.push(elapsed);
        else timings.socketConnectMs.push(elapsed);
        if (!success) errors.push({ stage: reconnect ? 'reconnect' : 'connect', user: user.index, error });
        resolve(success);
      };
      const onConnect = () => {
        user.connected = true;
        finish(true);
      };
      const onError = (error) => finish(false, errorText(error));
      const timer = setTimeout(() => finish(false, 'timeout'), 10000);
      user.socket.once('connect', onConnect);
      user.socket.once('connect_error', onError);
      user.socket.connect();
    });
  }

  let healthRunning = true;
  const healthProbe = (async () => {
    while (healthRunning) {
      const probeStarted = performance.now();
      try {
        const result = await requestJson(options.baseUrl, '/health', { timeoutMs: 5000 });
        timings.healthMs.push(performance.now() - probeStarted);
        if (result.response.ok && result.body?.status === 'ok') counts.healthSucceeded += 1;
        else counts.healthFailed += 1;
      } catch (error) {
        timings.healthMs.push(performance.now() - probeStarted);
        counts.healthFailed += 1;
        errors.push({ stage: 'health', error: errorText(error) });
      }
      await sleep(250);
    }
  })();

  const connectStarted = performance.now();
  const rampInterval = options.users > 1 ? options.rampMs / (options.users - 1) : 0;
  const connectPromises = users.map(async (user, index) => {
    if (index > 0 && rampInterval > 0) await sleep(index * rampInterval);
    const success = await connectUser(user, false);
    if (success) counts.socketConnectSucceeded += 1;
    else counts.socketConnectFailed += 1;
  });
  await Promise.all(connectPromises);
  const connectDurationMs = performance.now() - connectStarted;
  if (counts.socketConnectFailed > 0) throw new Error(`${counts.socketConnectFailed} sockets failed to connect`);

  for (let cycle = 1; cycle <= options.cycles; cycle += 1) {
    const cycleStarted = performance.now();
    for (const user of users) {
      user.state = 'searching';
      user.currentRoom = null;
      user.roomUsers = [];
      user.leaveProbe = null;
      user.joinStartedAt = performance.now();
      user.socket.emit('join-room', { gwant: 'R', miRating: 0, maRating: 5 });
    }

    const allMatched = await waitFor(
      () => users.every((user) => user.state === 'matched'),
      options.matchTimeoutMs,
    );
    const matchedUsers = users.filter((user) => user.state === 'matched');
    const roomMap = new Map();
    for (const user of matchedUsers) {
      if (!roomMap.has(user.currentRoom)) roomMap.set(user.currentRoom, []);
      roomMap.get(user.currentRoom).push(user);
    }
    const validRooms = [...roomMap.entries()].filter(([, members]) => members.length === 2);
    const malformedRooms = [...roomMap.entries()].filter(([, members]) => members.length !== 2);
    for (const [roomId, members] of malformedRooms) {
      counts.invalidMatches += members.length;
      errors.push({ stage: 'room-cardinality', cycle, roomId, members: members.map((user) => user.index) });
    }

    const cycleMessageKeys = [];
    await Promise.all(
      validRooms.flatMap(([roomId, members]) =>
        members.map(async (user) => {
          for (let messageIndex = 0; messageIndex < options.messages; messageIndex += 1) {
            const identityKey = `lt-${options.seed}-${cycle}-${user.index}-${messageIndex}-${Date.now()}-${Math.floor(random() * 1e9)}`;
            pendingMessages.set(identityKey, {
              roomId,
              expected: new Set(members.map((member) => member.selfId)),
              receivers: new Set(),
              sentAt: performance.now(),
            });
            cycleMessageKeys.push(identityKey);
            counts.messagesSent += 1;
            user.socket.emit('message', {
              messageContent: `load cycle ${cycle}, user ${user.index}, message ${messageIndex}`,
              chatId: 0,
              identityKey,
              type: 'text',
            });
            await sleep(2 + Math.floor(random() * 8));
          }
        }),
      ),
    );

    await waitFor(
      () => cycleMessageKeys.every((key) => {
        const pending = pendingMessages.get(key);
        return pending && pending.receivers.size >= pending.expected.size;
      }),
      options.messageTimeoutMs,
    );

    let cycleMissingDeliveries = 0;
    for (const key of cycleMessageKeys) {
      const pending = pendingMessages.get(key);
      const missing = Math.max(0, pending.expected.size - pending.receivers.size);
      cycleMissingDeliveries += missing;
      counts.missingDeliveries += missing;
      pendingMessages.delete(key);
    }

    const hardLeaders = [];
    const leavePairs = [];
    for (const [, members] of validRooms) {
      const leaderIndex = random() < 0.5 ? 0 : 1;
      const leader = members[leaderIndex];
      const follower = members[1 - leaderIndex];
      const hardDisconnect = random() < options.reconnectRate;
      follower.leaveProbe = { startedAt: performance.now(), recorded: false };
      leavePairs.push({ leader, follower, hardDisconnect });
      if (hardDisconnect) {
        counts.hardDisconnects += 1;
        leader.intentionalDisconnect = true;
        leader.socket.disconnect();
        hardLeaders.push(leader);
      } else {
        leader.socket.emit('leave-room');
      }
    }

    await waitFor(
      () => leavePairs.every(({ follower }) => follower.leaveProbe?.recorded),
      options.leaveTimeoutMs,
    );
    for (const { leader, follower } of leavePairs) {
      if (!follower.leaveProbe?.recorded) counts.leaveNoticeTimeouts += 1;
      follower.socket.emit('leave-room');
      leader.state = 'idle';
      follower.state = 'idle';
      leader.currentRoom = null;
      follower.currentRoom = null;
      leader.roomUsers = [];
      follower.roomUsers = [];
      leader.leaveProbe = null;
      follower.leaveProbe = null;
    }

    await sleep(options.settleMs);
    for (const leader of hardLeaders) {
      const reconnectDelay = options.reconnectDelayMinMs +
        Math.floor(random() * (options.reconnectDelayMaxMs - options.reconnectDelayMinMs + 1));
      await sleep(reconnectDelay);
      const success = await connectUser(leader, true);
      if (success) counts.reconnectSucceeded += 1;
      else counts.reconnectFailed += 1;
    }

    cycleResults.push({
      cycle,
      allMatched,
      matchedUsers: matchedUsers.length,
      rooms: validRooms.length,
      malformedRooms: malformedRooms.length,
      messages: cycleMessageKeys.length,
      missingDeliveries: cycleMissingDeliveries,
      hardDisconnects: hardLeaders.length,
      durationMs: Math.round((performance.now() - cycleStarted) * 100) / 100,
    });
  }

  for (const user of users) {
    if (!user.socket) continue;
    if (user.connected) {
      user.intentionalDisconnect = true;
      user.socket.emit('leave-room');
      user.socket.disconnect();
    }
  }
  await sleep(750);
  healthRunning = false;
  await healthProbe;

  const expectedDeliveries = counts.messagesSent * 2;
  const matchedOpportunities = options.users * options.cycles;
  const result = {
    generatedAt: new Date().toISOString(),
    target: options.baseUrl,
    configuration: {
      users: options.users,
      cycles: options.cycles,
      messagesPerUserPerCycle: options.messages,
      rampMs: options.rampMs,
      reconnectRate: options.reconnectRate,
      seed: options.seed,
      emailPrefix: options.emailPrefix,
    },
    durationsMs: {
      total: Date.now() - startedAt.getTime(),
      provision: Math.round(provisionDurationMs * 100) / 100,
      loginAndIdentity: Math.round(loginDurationMs * 100) / 100,
      socketRamp: Math.round(connectDurationMs * 100) / 100,
    },
    counts,
    rates: {
      provisionSuccess: (counts.provisionCreated + counts.provisionExisting) / options.users,
      loginSuccess: counts.loginSucceeded / options.users,
      socketConnectSuccess: counts.socketConnectSucceeded / options.users,
      matchSuccess: counts.matchEvents / matchedOpportunities,
      messageDeliverySuccess: expectedDeliveries === 0 ? 1 : counts.uniqueDeliveries / expectedDeliveries,
      leaveNoticeSuccess:
        counts.leaveNotices + counts.leaveNoticeTimeouts === 0
          ? 1
          : counts.leaveNotices / (counts.leaveNotices + counts.leaveNoticeTimeouts),
      reconnectSuccess:
        counts.reconnectSucceeded + counts.reconnectFailed === 0
          ? 1
          : counts.reconnectSucceeded / (counts.reconnectSucceeded + counts.reconnectFailed),
      healthSuccess:
        counts.healthSucceeded + counts.healthFailed === 0
          ? 1
          : counts.healthSucceeded / (counts.healthSucceeded + counts.healthFailed),
    },
    latencyMs: Object.fromEntries(Object.entries(timings).map(([key, values]) => [key, summarize(values)])),
    cycles: cycleResults,
    errors: errors.slice(0, 200),
    errorCount: errors.length,
  };

  if (options.jsonPath) {
    fs.writeFileSync(options.jsonPath, `${JSON.stringify(result, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  }

  const percent = (value) => `${(value * 100).toFixed(2)}%`;
  process.stdout.write('\nResult summary\n');
  process.stdout.write(`  Provision: ${counts.provisionCreated} created, ${counts.provisionExisting} existing, ${counts.provisionFailed} failed\n`);
  process.stdout.write(`  Login success: ${percent(result.rates.loginSuccess)}\n`);
  process.stdout.write(`  Socket connect success: ${percent(result.rates.socketConnectSuccess)}\n`);
  process.stdout.write(`  Match success: ${percent(result.rates.matchSuccess)} (p95 ${result.latencyMs.matchMs.p95 ?? 'n/a'} ms)\n`);
  process.stdout.write(`  Duplicate match events: ${counts.duplicateMatchEvents}\n`);
  process.stdout.write(`  Message delivery: ${percent(result.rates.messageDeliverySuccess)} (p95 ${result.latencyMs.messageDeliveryMs.p95 ?? 'n/a'} ms)\n`);
  process.stdout.write(`  Leave notices: ${percent(result.rates.leaveNoticeSuccess)} (p95 ${result.latencyMs.leaveNoticeMs.p95 ?? 'n/a'} ms)\n`);
  process.stdout.write(`  Reconnect success: ${percent(result.rates.reconnectSuccess)}\n`);
  process.stdout.write(`  Health success: ${percent(result.rates.healthSuccess)} (p95 ${result.latencyMs.healthMs.p95 ?? 'n/a'} ms)\n`);
  process.stdout.write(`  Unexpected disconnects: ${counts.unexpectedDisconnects}; server socket errors: ${counts.serverSocketErrors}\n`);
  if (options.jsonPath) process.stdout.write(`  JSON: ${options.jsonPath}\n`);

  const passed =
    result.rates.loginSuccess === 1 &&
    result.rates.socketConnectSuccess >= 0.99 &&
    result.rates.matchSuccess >= 0.99 &&
    result.rates.messageDeliverySuccess >= 0.999 &&
    result.rates.reconnectSuccess >= 0.99 &&
    counts.duplicateMatchEvents === 0 &&
    counts.invalidMatches === 0 &&
    counts.wrongRoomDeliveries === 0 &&
    counts.unexpectedDisconnects === 0 &&
    counts.serverSocketErrors === 0 &&
    counts.healthFailed === 0;
  process.exitCode = passed ? 0 : 2;
}

main().catch((error) => {
  process.stderr.write(`Load test failed: ${error.stack || error.message || error}\n`);
  process.exitCode = 1;
});
