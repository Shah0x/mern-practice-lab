class CacheNode {
    key: number;
    value: number;
    next: CacheNode | null = null;
    prev: CacheNode | null = null;

    constructor(key: number, value: number) {
        this.key = key;
        this.value = value;
    }
}

/**
 * LRU Cache implementation for coding practice.
 * TODO: Make this generic <K, V> instead of hardcoded to numbers.
 */
class LRUCache {
    private capacity: number;
    private map: Map<number, CacheNode>;
    private head: CacheNode;
    private tail: CacheNode;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.map = new Map();
        
        // Dummy head and tail to prevent annoying null pointer checks
        this.head = new CacheNode(0, 0);
        this.tail = new CacheNode(0, 0);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    get(key: number): number {
        if (!this.map.has(key)) {
            // console.log(`[DEBUG] Cache miss for key: ${key}`);
            return -1;
        }

        const node = this.map.get(key)!;
        this.moveToHead(node);
        return node.value;
    }

    put(key: number, value: number): void {
        if (this.map.has(key)) {
            const node = this.map.get(key)!;
            node.value = value;
            this.moveToHead(node);
        } else {
            const newNode = new CacheNode(key, value);
            this.map.set(key, newNode);
            this.addToHead(newNode);

            if (this.map.size > this.capacity) {
                // Remove least recently used item from list and map
                const lru = this.tail.prev!;
                this.removeNode(lru);
                this.map.delete(lru.key);
                // console.log(`[DEBUG] Evicted key: ${lru.key} due to capacity limit`);
            }
        }
    }

    // --- Linked List Helpers ---

    private addToHead(node: CacheNode): void {
        node.next = this.head.next;
        node.prev = this.head;
        
        if (this.head.next) {
            this.head.next.prev = node;
        }
        this.head.next = node;
    }

    private removeNode(node: CacheNode): void {
        const prevNode = node.prev;
        const nextNode = node.next;

        if (prevNode) prevNode.next = nextNode;
        if (nextNode) nextNode.prev = prevNode;
    }

    private moveToHead(node: CacheNode): void {
        this.removeNode(node);
        this.addToHead(node);
    }
}

// Simple manual verification block
// TODO: Write actual Jest unit tests for this tomorrow
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
// console.log(cache.get(1)); // should return 1
cache.put(3, 3);            // evicts key 2
// console.log(cache.get(2)); // should return -1 (evicted)
cache.put(4, 4);            // evicts key 1
// console.log(cache.get(1)); // should return -1 (evicted)
// console.log(cache.get(3)); // should return 3
// console.log(cache.get(4)); // should return 4