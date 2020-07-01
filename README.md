# custom-apollo-ssr

Minimal example to replace Apollo Client for faster Server Side Rendering:

- update the original query using `addTypenameToDocument`. This step is needed to create the proper the in-memory cache indexes
- extract operation name from the document, needed by the fetch request.
- generate the `persisted query hash`
- run the fetch request, fallback in case the persisted query is not available
- write the query to the in-memory cache (note the use of `cache.write` instead of `cache.writeQuery`)
- extract and return the in-memory state