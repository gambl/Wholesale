Wholesale
=========

Chrome plugin to investigate information loss and rediscovery in Wikipedia. Enriches a Wikipedia article by providing a sliding timeline of diffs, and marks along the timeline any points of potential information loss. 

Currently identifies information loss simply by looking at the total size of the article between edits `n` and `n+1` and will mark any where `size(n) > size(n+1)`. Scope to introduce more detailed heuristics.   
