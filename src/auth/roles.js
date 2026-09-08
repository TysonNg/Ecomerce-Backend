'use strict';

const hasRequiredRole = (roles = [], requiredRoles = []) =>
  requiredRoles.some((role) => roles.includes(role));

const mergeRoles = (roles = [], role) =>
  roles.includes(role) ? roles : [...roles, role];

module.exports = { hasRequiredRole, mergeRoles };
