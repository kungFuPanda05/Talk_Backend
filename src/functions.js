var longestCommonSubsequence = function (text1, text2) {
    let m = text1.length;
    let n = text2.length;

    // Create a 2D array to store the length of the common subsequence
    const dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));

    // Fill the array using dynamic programming
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[m][n];
};

function countCommonLetters(s1, s2) {
    // Convert both strings to lowercase and create sets of unique letters
    const set1 = new Set(s1.toLowerCase());
    const set2 = new Set(s2.toLowerCase());

    // Count common letters
    let commonCount = 0;
    for (let char of set1) {
        if (set2.has(char)) {
            commonCount++;
        }
    }
    return commonCount;
}


export const match = (word, search) => {
    if (search == "") return true;
    search = search.toLowerCase();
    word = word.toLowerCase();
    let isSubstring = word.includes(search);
    let lgc = longestCommonSubsequence(word, search);
    let sameLetters = countCommonLetters(word, search);
    if (isSubstring) return true;
    if (search.length < word.length) {
        if (lgc == search.length) return true;
        if (sameLetters > (3 * search.length / 4) && lgc > (2 * search.length) / 3) return true;
    } else {
        if (lgc == word.length) return true;
        if (sameLetters > (3 * word.length / 4) && lgc > (2 * search.length) / 3) return true;
    }

    return false;

}

export const similarityIndex = (word, search) => {
    search = search.toLowerCase();
    word = word.toLowerCase();
    if (word == search) return 1;
    let isSubstring = word.includes(search);
    let isReverseSubstring = search.includes(word);
    let lgc = longestCommonSubsequence(word, search);
    let sameLetters = countCommonLetters(word, search);
    let lgcIndex = 1.2 * (lgc / Math.max(word.length, search.length));
    let sameLettersIndex = sameLetters / Math.max(word.length, search.length);
    let score = 0;
    score += isSubstring ? 0.15 : 0;
    score += isReverseSubstring ? 0.15 : 0;
    return (lgcIndex + sameLettersIndex) / 2 + score;
}

let transformArray = (array) => {
    let sampleWord = "a";
    let lettersObj = {
        0: 'a',
        1: 'a',
        2: 'b',
        3: 'c',
        4: 'd',
        5: 'e',
        6: 'f',
        7: 'g',
        8: 'h',
        9: 'i',
        10: 'j',
        11: 'k',
        12: 'l',
        13: 'm',
        14: 'n',
        15: 'o',
        16: 'p',
        17: 'q',
        18: 'r',
        19: 's',
        20: 't',
        21: 'u',
        22: 'v',
        23: 'w',
        24: 'x',
        25: 'y',
        26: 'z'
    }
    let transformedWord = "";
    for (let el of array) {
        let similarityRatio = similarityIndex(el, sampleWord);
        transformedWord += lettersObj[Math.floor(similarityRatio * 26)];
    }
    return transformedWord;
}

export const sentenceMatchRatio = (sentence, search) => {
    sentence = sentence.toLowerCase();
    search = search.toLowerCase();
    if (sentence === search) return 1;
    let absoluteSimilarityIndex = similarityIndex(sentence, search);
    if (absoluteSimilarityIndex > process.env.MATCH_PERCENTAGE) return absoluteSimilarityIndex;
    let sentenceArray = sentence.split(' ');
    let searchArray = search.split(' ');
    let similarityRatio = similarityIndex(transformArray(sentenceArray), transformArray(searchArray));
    return (absoluteSimilarityIndex + similarityRatio) / 2;
}
export const weightedRandomChoice = (items, probabilities) => {
    if (items.length !== probabilities.length) {
        throw new Error("Items and probabilities arrays must be the same length.");
    }

    const total = probabilities.reduce((acc, prob) => acc + prob, 0);
    if (total <= 0) {
        throw new Error("Total probability must be greater than 0.");
    }

    const normalized = probabilities.map(prob => prob / total);
    let r = Math.random();
    let cumulative = 0;

    for (let i = 0; i < normalized.length; i++) {
        cumulative += normalized[i];
        if (r < cumulative) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

export const sleep=(ms)=> {
    return new Promise(resolve => setTimeout(resolve, ms));
}