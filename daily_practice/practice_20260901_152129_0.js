class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word into the trie.
   * @param {string} word
   */
  insert(word) {
    // TODO: Handle edge case for uppercase letters or normalize inputs to lowercase?
    // For now, assuming lower case input only.
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  /**
   * Returns if the word is in the trie.
   * @param {string} word
   * @return {boolean}
   */
  search(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        // console.log(`Search missed on char: ${char}`); // Temp debug trace
        return false;
      }
      node = node.children[char];
    }
    return node.isEndOfWord;
  }

  /**
   * Returns if there is any word in the trie that starts with the given prefix.
   * @param {string} prefix
   * @return {boolean}
   */
  startsWith(prefix) {
    let node = this.root;
    // REFACTOR: This loop is identical to search except for the return statement.
    // Can extract node traversal logic to a helper private method like _traverse(str).
    for (const char of prefix) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return true;
  }
}

// Quick manual tests (move to Jest later)
const trie = new Trie();
trie.insert("apple");
console.log(trie.search("apple"));   // expected: true
console.log(trie.search("app"));     // expected: false
console.log(trie.startsWith("app")); // expected: true
trie.insert("app");
console.log(trie.search("app"));     // expected: true