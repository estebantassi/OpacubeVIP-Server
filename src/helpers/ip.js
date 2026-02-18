function GetClientIP(req) {
  if (!req) return null;

  const xForwarded = req.headers?.['x-forwarded-for'];
  if (xForwarded) return xForwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null;
}

module.exports = { GetClientIP };