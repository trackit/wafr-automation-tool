import { render } from '@testing-library/react';

import Tabs from './tabs';

describe('Tabs', () => {
  it('should render successfully', () => {
    const tabs = [
      { label: 'Tab 1', id: 'tab1' },
      { label: 'Tab 2', id: 'tab2' },
    ];
    const { baseElement } = render(
      <Tabs
        tabs={tabs}
        activeTab="tab1"
        onChange={() => {
          console.log('clicked');
        }}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
