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


export const match=(word, search)=>{
    let isSubstring = word.includes(search);
    let lgc = longestCommonSubsequence(word, search);
    let sameLetters = countCommonLetters(word, search);
    if(isSubstring) return true;
    if(search.length<word.length){
        if(lgc == search.length) return true;
        if(sameLetters>(3*search.length/4) && lgc>(2*search.length)/3) return true;
    }else{
        if(lgc == word.length) return true;
        if(sameLetters>(3*word.length/4) && lgc>(2*search.length)/3) return true;
    }

    return false;

}