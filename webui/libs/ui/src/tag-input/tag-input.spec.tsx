import { render } from '@testing-library/react';
import TagInput from './tag-input';

describe('TagInput', () => {
  it('should render', () => {
    const tags: Set<string> = new Set();
    const setTags = vi.fn();

    const { baseElement } = render(
        <TagInput tags={tags} setTags={setTags} inputProps={{}} />
    );
    expect(baseElement).toBeTruthy();
  });
});