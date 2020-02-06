import * as React from 'react';

/**
 * @param {string} prefix - String to use as ID prefix
 */
export function getUniqueId(prefix = 'pf') {
  const uid =
    new Date().getTime() +
    Math.random()
      .toString(36)
      .slice(2);
  return `${prefix}-${uid}`;
}

/**
 * Returns the given React children prop as a regular array of React nodes.
 *
 * @param {React.ReactNode} children - React children
 */
export const childrenToArray = (children: React.ReactNode) =>
  children && React.Children.count(children) > 0 && React.Children.toArray(children);
