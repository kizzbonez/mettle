Tessera is an embedded storage engine. It reads and writes fixed-size pages, and keeps the most
recently used ones in memory so that hot data does not go to disk.

The current page cache is a `Vec<(PageId, Page)>`. Every lookup scans it from the front, and
every hit moves the entry by shifting everything before it. That was fine at 256 pages. A
customer now runs with a cache of 100,000 pages, and a flame graph of their workload looks like
this:

```text
Engine::read_page ............................. 61%
  PageCache::get .............................. 41%
    find the page   (Iterator::position) ...... 24%
    move it forward (Vec::remove, insert) ..... 17%
```

You are replacing it with a least-recently-used cache whose operations take constant time at
any capacity. Three requirements come from how the engine uses it:

- **Pages can be dirty.** When a page leaves the cache, the engine must get it back so that it
  can write it to disk. A cache that drops an evicted page silently loses data.
- **Keys are generic.** The engine also caches table metadata by name, and looking up a
  `String` key must not require building a `String`.
- **Operations watches the numbers.** Hits, misses and evictions are exported as metrics, and
  the capacity plan is only as good as those counters.
