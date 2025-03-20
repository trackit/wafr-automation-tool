import { render } from '@testing-library/react';

import BestPracticeTable from './best-practice-table';

describe('BestPracticeTable', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BestPracticeTable />);
    expect(baseElement).toBeTruthy();
  });
});
