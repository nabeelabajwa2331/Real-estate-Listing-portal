import { validationResult } from 'express-validator';

export default function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const e of result.array({ onlyFirstError: true })) errors[e.path] = e.msg;

  res.status(400).json({ message: Object.values(errors)[0], errors });
}
