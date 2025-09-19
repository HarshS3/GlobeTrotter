import Joi from 'joi';
import { ApiError } from '../core/apiError.js';

export function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) throw ApiError.badRequest('Validation Error', error.details.map(d => d.message));
        req.body = value;
      }
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, { abortEarly: false });
        if (error) throw ApiError.badRequest('Validation Error', error.details.map(d => d.message));
        req.params = value;
      }
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, { abortEarly: false });
        if (error) throw ApiError.badRequest('Validation Error', error.details.map(d => d.message));
        req.query = value;
      }
      next();
    } catch (e) { next(e); }
  };
}

export const JoiId = Joi.number().integer().positive();
