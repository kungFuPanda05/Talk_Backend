let topWaitingFemaleUsers = [];
let topWaitingMaleUsers = [];

export default {
    insert: (user) => {
        let array = user.gender === "M" ? topWaitingMaleUsers : topWaitingFemaleUsers;
        if (array.length == 0) {
            array.push({ ...user, enteredAt: Date.now() });
        } else {
            let left = 0, right = array.length - 1;
            while (left <= right) {
                let mid = Math.floor((left + right) / 2);
                if (array[mid].enteredAt === user.enteredAt) {
                    left = mid;
                    break;
                } else if (array[mid].enteredAt < user.enteredAt) {
                    left = mid + 1;
                } else {
                    right = mid - 1;
                }
            }
            array.splice(left, 0, { ...user, enteredAt: Date.now() });
            if (array.length > 10) array.pop();
        }
    },
    get: () => {
        return { topWaitingFemaleUsers, topWaitingMaleUsers };
    },
    remove: (user) => {
        if (user.gender === "M") {
            topWaitingMaleUsers = topWaitingMaleUsers.filter(u => u.id !== user.id);
        } else {
            topWaitingFemaleUsers = topWaitingFemaleUsers.filter(u => u.id !== user.id);
        }
    }
}