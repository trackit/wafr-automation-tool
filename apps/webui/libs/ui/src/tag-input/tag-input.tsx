import { ChangeEvent, FocusEvent, KeyboardEvent, useState } from 'react';

export function TagsInput({
  tags,
  setTags,
  inputProps,
}: {
  tags: Set<string>;
  setTags: (tags: Set<string>) => void;
  inputProps: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'onKeyDown' | 'onBlur'
  >;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').filter(Boolean);
    if (values.length > 1) {
      addTags(values.map((v) => v.trim()));
    } else {
      setInputValue(e.target.value.replace(/,+$/, ''));
    }
  };

  const addTags = (add: string[]) => {
    setTags(new Set([...tags, ...add]));
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    const newTags = new Set(tags);
    newTags.delete(tag);
    setTags(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
      e.preventDefault();
      addTags([inputValue.trim()]);
    }
    if (e.key === 'Backspace' && inputValue === '' && tags.size) {
      e.preventDefault();
      const lastTag = Array.from(tags).pop();
      if (lastTag) removeTag(lastTag);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (inputValue.trim() !== '') {
      addTags([inputValue.trim()]);
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
