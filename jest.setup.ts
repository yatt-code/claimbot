// Optional: configure or set up a testing framework before each test.
// For example, if you use @testing-library/react, you might include:
import '@testing-library/jest-dom'

// Learn more: https://github.com/testing-library/jest-dom

// Polyfill for Request, Response, and Headers for Jest environment
// This is needed because Next.js API routes use Web APIs (Request, Response, Headers)
// which are not natively available in Node.js Jest environment by default.
// Using dynamic import to handle ES Modules in a CommonJS context.
// This needs to be at the top level to ensure polyfills are available early.
// Use a direct require for node-fetch to avoid issues with Jest's ESM handling

const nodeFetch = require('node-fetch');

if (typeof global.Request === 'undefined') {
  global.Request = nodeFetch.Request;
}
if (typeof global.Response === 'undefined') {
  global.Response = nodeFetch.Response;
}
if (typeof global.Headers === 'undefined') {
  global.Headers = nodeFetch.Headers;
}