function authMiddleware(req, res, next) {
    const { authorization } = req.headers;
  
    if (!authorization || authorization !== "Basic my-simple-token") {
      return res.status(401).json({ error: "Não autorizado" });
    }
  
    next();
  }
  
  module.exports = authMiddleware;