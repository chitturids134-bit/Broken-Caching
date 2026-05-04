# Changes Made to SideHustle Backend

## 1. Caching Implementation Improvements
- **Issue**: The original implementation used a single global cache key (`global_data_key`) for all tasks, which led to incorrect data being served. It also lacked a TTL (Time-To-Live) mechanism, causing memory leaks and stale data.
- **Fix**: 
    - Introduced a `CacheService` in `src/services/cache.service.js`.
    - Implemented namespaced cache keys: `tasks:list` for the full list and `tasks:item:${id}` for individual tasks.
    - Added TTL support (defaulting to 5 minutes, configurable via `.env`).
    - Implemented cache invalidation: The list cache is cleared on `POST` and `DELETE`, and the specific item cache is cleared on `DELETE`.

## 2. Async/Await and Promise Handling
- **Issue**: Promises were being stored in the cache instead of resolved data, leading to serialization issues.
- **Fix**: Ensured all Prisma calls are properly `await`-ed before caching or returning data.

## 3. Error Handling and Stability
- **Issue**: Errors were being swallowed by `console.log`, causing requests to hang indefinitely.
- **Fix**: 
    - Implemented a central error handler in `src/middleware/errorHandler.js`.
    - Added `next(err)` to all catch blocks to ensure errors are forwarded and responded to.
    - Added specific handling for Prisma errors (P2002 for unique constraints, P2025 for record not found).
    - Added null guards to return 404 instead of crashing or returning `null` when a record is missing.

## 4. HTTP Status Codes
- **Issue**: The API returned `200 OK` for all operations, including resource creation and deletion.
- **Fix**: 
    - `POST /tasks` now returns `201 Created`.
    - `DELETE /tasks/:id` now returns `204 No Content`.
    - Added `404 Not Found` for missing tasks.
    - Added `400 Bad Request` for invalid input or IDs.

## 5. Security and Configuration
- **Issue**: Ports and potential database URLs were hardcoded. CORS was wide open without configuration.
- **Fix**: 
    - Moved configuration to a `.env` file.
    - Configured CORS with `FRONTEND_ORIGIN` from environment variables.
    - Used `process.env.PORT` for server initialization.

## 6. Code Refactoring
- **Issue**: All logic was crammed into `index.js`.
- **Fix**: Refactored logic into specialized service and middleware layers for better maintainability and separation of concerns.
