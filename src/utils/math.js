export const easeInOutQuad = (t) => t < 0.1 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const isPowerOfTwo = (n) => n !== 0 && (n & (n - 1)) === 0;