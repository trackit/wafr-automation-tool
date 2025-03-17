import { render } from '@testing-library/react';

import VerticalMenu from './vertical-menu';

describe('VerticalMenu', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<VerticalMenu />);
    expect(baseElement).toBeTruthy();
  });
});
