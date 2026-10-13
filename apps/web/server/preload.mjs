// Loaded before the Next.js server (node --import). It makes this process the
// authority on X-Forwarded-For.
//
// Next.js passes /api requests to the API without adding the client's address,
// and passes on any X-Forwarded-For the client sent. Left alone, the API would
// see every visitor as this container, or as whoever the visitor claimed to be,
// and its rate limits would be wrong either way. This sets the header from the
// connection itself before Next.js sees the request.
import http from 'node:http';
import { forwardedFor } from './forwarded-for.mjs';

const emit = http.Server.prototype.emit;

http.Server.prototype.emit = function emitWithClientAddress(event, request, ...rest) {
  if ((event === 'request' || event === 'upgrade') && request?.headers && request.socket) {
    const value = forwardedFor(request.headers['x-forwarded-for'], request.socket.remoteAddress);
    if (value) request.headers['x-forwarded-for'] = value;
  }
  return emit.call(this, event, request, ...rest);
};
