You work on the help center of a small company that sells invoicing software. Customers type a
question into the search box, and the keyword search often comes back empty. Someone who types
"I can't get into my account" never finds the article called "Reset your password", because the
two share no words.

The team wants to try semantic search. An embedding model has already turned each article into
a vector, and the vectors are waiting in `data/articles.json`:

```json
{"id": "kb-101", "title": "Reset your password", "embedding": [0.9, 0.1, 0.0, 0.1]}
```

To keep the numbers readable, these vectors have 4 components. A real embedding model produces
hundreds or thousands, but the arithmetic is exactly the same.

At query time the same model embeds the customer's question. Your code takes that query vector
and finds the articles whose vectors point in the most similar direction. Nothing here calls a
model: every vector is given to you.

The search results page shows a ranked list, and support staff compare today's ranking with
yesterday's when they tune the articles. The order has to be the same every time, even when two
articles score exactly the same.
