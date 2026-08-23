# Local ChitTalk load testing

This harness provisions deterministic test users, logs them in through the REST
API, opens authenticated Socket.IO connections, repeatedly matches pairs in
surprise mode, exchanges correlated text messages, mixes graceful leaves with
hard disconnect/reconnect churn, and records latency/error metrics.

It refuses non-loopback targets unless `--allow-non-loopback` is supplied. Do
not use that override for routine testing.

Example against the isolated local backend on port 4100:

```sh
node scripts/chittalk-load-test.cjs \
  --base-url http://127.0.0.1:4100 \
  --users 100 \
  --cycles 3 \
  --messages 3 \
  --ramp-ms 2000 \
  --email-prefix chittalk-load-20260814 \
  --json /tmp/chittalk-load-100.json
```

Use an even user count. The default `gwant: "R"` matching mode avoids coin
deductions. Account provisioning is reported separately from the timed login,
socket, match, chat, leave, and reconnect phases.

