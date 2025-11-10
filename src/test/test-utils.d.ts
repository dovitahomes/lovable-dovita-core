import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';

declare module '@/test/test-utils' {
  export * from '@testing-library/react';
  export { screen, waitFor };
}
