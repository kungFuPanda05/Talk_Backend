import { redisClient, redisEnabled } from "./redis";
import addJobAndWait from "./initQueue";

// const trieQueue = new Queue("trieQueue", { connection: redisClient });

function getReplyFromTrie(trie, hashedContext) {
  const parts = hashedContext.split("|");
  let node = trie;
  for (const part of parts) {
    if (!node.children || !node.children[part]) {
      return null;
    }
    node = node.children[part];
  }
  // If node.reply is an array, pick a random response.
  if (node.reply && Array.isArray(node.reply)) {
    const responses = node.reply;
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }
  return node.reply;
}

class ChatTrie {
  async storeReply(hashedContext, response) {
    if (!redisEnabled || !redisClient) return false;

    // await trieQueue.add("store", { hashedContext, response });
    return addJobAndWait("trieQueue", { hashedContext, response });
  }

  // Retrieve a reply by loading the trie from Redis and performing a lookup.
  async getReply(hashedContext) {
    if (!redisEnabled || !redisClient) return null;

    const trieStr = await redisClient.get("chatTrie");
    if (!trieStr) {
      return null;
    }
    const trie = JSON.parse(trieStr);
    return getReplyFromTrie(trie, hashedContext);
  }
}
export default ChatTrie;

// // // Example usage:
// (async () => {
//   const chatTrie = new ChatTrie();

//   // Store two replies. The trie structure will share common prefixes.
//   await chatTrie.storeReply("M_abuse(madarchod)", "Teri gaand faad dunga bhosdike");
//   await chatTrie.storeReply("M_greet|F_greet", "How are you?");

//   // Let's add another response to the same context.
//   await chatTrie.storeReply("M_greet|F_greet", "What's up?");

//   // Wait a few seconds for the worker to process the jobs.
//   setTimeout(async () => {
//     const reply1 = await chatTrie.getReply("M_greet|F_greet");
//     const reply2 = await chatTrie.getReply("M_abuse(madarchod)");
//     console.log("Random reply for 'M_greet|F_greet':", reply1); // Randomly "How are you?" or "What's up?"
//     console.log("Reply for 'M_abuse(madarchod)':", reply2); // Expected: "Teri gaand faad dunga bhosdike"
//     process.exit(0);
//   }, 3000);
// })();
