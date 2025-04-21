import { ChangeEvent, FocusEvent, KeyboardEvent, useState } from 'react';

export function TagsInput({
  tags = [],
  setTags,
  inputProps
}: {
  tags: string[];
  setTags: (tags: string[]) => void;
  inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onKeyDown' | 'onBlur'>;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.replace(/,+$/, ''));
  };

  const addTag = (tag: string) => {
    setInputValue('');
    if (tags.includes(tag)) return;
    setTags([...tags, tag]);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === 'Enter' || e.key === ',') &&
      inputValue.trim() !== ''
    ) {
      e.preventDefault();
      addTag(inputValue.trim());
    }
    if (e.key === 'Backspace' && inputValue === '' && tags.length) {
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (inputValue.trim() !== '') {
      addTag(inputValue.trim());
    }
  };

  return (
    <input
      {...inputProps}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}

export default TagsInput;