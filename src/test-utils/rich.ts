import type { Rich } from '../domain/steps';

export const plain = (rich: Rich): string => rich.map((p) => (typeof p === 'string' ? p : p.strong)).join('');
