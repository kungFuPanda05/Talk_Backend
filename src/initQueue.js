import { Queue, QueueEvents } from "bullmq";
import { redisClient, redisEnabled } from './redis';

const queueMap = {};
const queueEventsMap = {};

function getQueue(queueName) {
    if (!queueMap[queueName]) {
        queueMap[queueName] = new Queue(queueName, { connection: redisClient });
    }
    return queueMap[queueName];
}

function getQueueEvents(queueName) {
    if (!queueEventsMap[queueName]) {
        queueEventsMap[queueName] = new QueueEvents(queueName, { connection: redisClient });
    }
    return queueEventsMap[queueName];
}

async function addJobAndWait(queueName, jobData, priority = 1) {
    if (!redisEnabled || !redisClient) {
        throw new Error('Redis-backed queues are disabled');
    }

    const queue = getQueue(queueName);
    const queueEvents = getQueueEvents(queueName);

    const job = await queue.add(queueName, jobData, { priority });
    console.log(`\x1b[32m📌 Job "${job.name}" (ID: ${job.id}) added to queue "${queueName}" with priority ${priority}\x1b[0m`);

    return new Promise((resolve, reject) => {
        const handleCompletion = ({ jobId, returnvalue }) => {
            if (jobId === job.id) {
                console.log(`✅ Job "${job.name}" (ID: ${jobId}) completed! Result: ${returnvalue}`);
                cleanupListeners();
                resolve(returnvalue);
            }
        };

        const handleFailure = ({ jobId, failedReason }) => {
            if (jobId === job.id) {
                console.error(`❌ Job "${job.name}" (ID: ${jobId}) failed! Reason: ${failedReason}`);
                cleanupListeners();
                reject(new RequestError(failedReason));
            }
        };

        const cleanupListeners = () => {
            queueEvents.off("completed", handleCompletion);
            queueEvents.off("failed", handleFailure);
        };

        queueEvents.on("completed", handleCompletion);
        queueEvents.on("failed", handleFailure);
    });
}
export default addJobAndWait;
