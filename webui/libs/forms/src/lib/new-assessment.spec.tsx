import { render } from '@testing-library/react';

import NewAssessment from './new-assessment';

describe('NewAssessment', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<NewAssessment />);
    expect(baseElement).toBeTruthy();
  });
});
