import { Queue, QueueEvents } from "bullmq";

const connection = { host: "127.0.0.1", port: 6379 };
const queueEventsMap = {};

function getQueue(queueName) {
    return new Queue(queueName, { connection });
}

function getQueueEvents(queueName) {
    if (!queueEventsMap[queueName]) {
        queueEventsMap[queueName] = new QueueEvents(queueName, { connection });
    }
    return queueEventsMap[queueName];
}

async function addJobAndWait(queueName, jobData, priority = 1) {
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
