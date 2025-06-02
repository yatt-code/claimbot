// __tests__/frontend/utils.test.ts
import { cn } from '@/lib/utils'; // Adjust the import path if necessary

describe('cn', () => {
  it('correctly combines simple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional class names with objects', () => {
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  it('handles conditional class names with arrays', () => {
    expect(cn('class1', ['class2', 'class3'])).toBe('class1 class2 class3');
  });

  it('handles mixed input types', () => {
    expect(cn('class1', { class2: true }, ['class3', { class4: true, class5: false }])).toBe('class1 class2 class3 class4');
  });

  it('merges Tailwind CSS classes correctly', () => {
    // Example of conflicting Tailwind classes
    expect(cn('p-4', 'p-6')).toBe('p-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('flex', 'block')).toBe('block');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn({}, [])).toBe('');
  });

  it('handles null and undefined inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(cn(null, undefined, 'class1')).toBe('class1');
  });
});