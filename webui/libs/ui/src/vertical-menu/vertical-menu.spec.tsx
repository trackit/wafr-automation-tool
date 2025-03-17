import { render } from '@testing-library/react';

import VerticalMenu from './vertical-menu';

describe('VerticalMenu', () => {
  it('should render successfully', () => {
    const items = [
      {
        text: 'Test Item',
        id: '1',
        onClick: () => {
          console.log('clicked');
        },
      },
    ];
    const { baseElement } = render(<VerticalMenu items={items} />);
    expect(baseElement).toBeTruthy();
  });
});
