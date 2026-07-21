export const requireDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: 'Not logged in'
    });
  }

  if (req.user.role !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Driver permissions required.',
      error: 'Access Denied'
    });
  }

  next();
};
export default requireDriver;
