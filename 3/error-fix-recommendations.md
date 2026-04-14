# Console Error Analysis Report
Generated: 2026-04-13T20:20:58.616Z
URL: http://localhost:8080/

## Summary
- Total Messages: 45
- Errors: 44
- Warnings: 0
- Logs: 1

## Error Categories
- Network/404: 1
- JavaScript Syntax: 43
- WebSocket: 0
- CORS: 0
- Resource Failed: 0
- Datafeed/API: 0
- Other: 0

## Top Errors
1. **error**: Failed to load resource: the server responded with a status of 404 (Not Found)
2. **pageerror**: Invalid or unexpected token
3. **pageerror**: Invalid or unexpected token
4. **pageerror**: Invalid or unexpected token
5. **pageerror**: Invalid or unexpected token
6. **pageerror**: Invalid or unexpected token
7. **pageerror**: Invalid or unexpected token
8. **pageerror**: Invalid or unexpected token
9. **pageerror**: Invalid or unexpected token
10. **pageerror**: Invalid or unexpected token

## Recommended Fixes
1. Add missing files to proxy configuration or ensure they exist locally
2. Fix JavaScript syntax errors in bundled files or ensure proper file encoding

## Detailed Error Log
```json
[
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 404 (Not Found)",
    "location": {
      "url": "http://localhost:8080/charting_library/tv_news",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "timestamp": "2026-04-13T20:20:48.967Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.284Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.564Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.568Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.568Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.569Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.574Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.574Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.576Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.652Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.665Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.680Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.691Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.785Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.798Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.806Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.961Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:52.973Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.041Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.707Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.730Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.734Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.743Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.801Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.823Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:53.828Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.005Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.178Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.180Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.181Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.183Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.263Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.284Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.289Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.293Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:54.300Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:55.363Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:55.366Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:55.373Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:55.377Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:56.274Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:56.313Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:56.331Z"
  },
  {
    "type": "pageerror",
    "name": "SyntaxError",
    "message": "Invalid or unexpected token",
    "stack": "",
    "timestamp": "2026-04-13T20:20:56.365Z"
  }
]
```
