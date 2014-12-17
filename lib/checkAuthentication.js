module.exports = function (req, res, next) {
  if (! (req.session.user && req.session.user.granted)) {
	  res.render("authError", {code: "notLoggedIn"});
  } else {
    next();
  }
}