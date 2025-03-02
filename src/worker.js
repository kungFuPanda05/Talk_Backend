import { QueueEvents, Worker } from "bullmq";
import fs from "fs";
import { redisClient } from "./redis";
import { chatContexts } from "./randomConnLogic";
import botFunctions from "./botFunctions";
import ChatTrie from "./chatContext";
// const redisClient = new Redis({
//     maxRetriesPerRequest: null,
//     retryStrategy: (times) => {
//       return times*1000;
//     }
//   });
//   redisClient.ping().then(res => console.log("Redis connected successfully to process workers")).catch(err => console.error("Error occured while connecting to redisClient services", err));


// Function to update the trie structure with a new context–reply pair.
function updateTrie(trie, hashedContext, response) {
  const parts = hashedContext.split("|");
  // Ensure the trie has a children property.
  if (!trie.children) {
    trie.children = {};
  }
  let node = trie;
  for (const part of parts) {
    if (!node.children[part]) {
      node.children[part] = { children: {} };
    }
    node = node.children[part];
  }
  // If node.reply doesn't exist, create an array. Otherwise, push the new response.
  if (!node.reply) {
    node.reply = [response];
  } else if (Array.isArray(node.reply)) {
    // To avoid duplicates, optionally check if response already exists.
    if (!node.reply.includes(response)) {
      node.reply.push(response);
    }
  }
  return trie;
}

const trieQueueWorker = new Worker(
  "trieQueue",
  async (job) => {
    const { hashedContext, response } = job.data;

    // Load the trie from Redis; initialize if it doesn't exist.
    let trieStr = await redisClient.get("chatTrie");
    let trie;
    if (trieStr) {
      trie = JSON.parse(trieStr);
    } else {
      trie = { children: {} };
    }

    // Update the trie with the new reply (space‑optimized insertion).
    trie = updateTrie(trie, hashedContext, response);

    // Save the updated trie back to Redis.
    await redisClient.set("chatTrie", JSON.stringify(trie));

    // (Optional) Backup the trie to a JSON file.
    fs.writeFileSync("trie-backup.json", JSON.stringify(trie, null, 2));
    console.log(`Updated trie for context: ${hashedContext}`);
  },
  { connection: redisClient }
);