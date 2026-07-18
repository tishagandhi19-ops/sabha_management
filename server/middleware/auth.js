import jwt from 'jsonwebtoken';

export default function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'કોઈ ટોકન નથી, પરવાનગી નામંજૂર છે' }); // "No token, authorization denied" in Gujarati
  }

  // Check if Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'ટોકન અમાન્ય ફોર્મેટમાં છે' }); // "Token is in invalid format"
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sabha_management_super_secret_key_987654321');
    req.admin = decoded.admin;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'ટોકન અમાન્ય છે' }); // "Token is invalid"
  }
}
