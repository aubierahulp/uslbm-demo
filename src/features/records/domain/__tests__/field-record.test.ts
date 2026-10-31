import {
  NOTES_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateRecordInput,
  type RecordInput,
  type RecordStatus,
} from '@/features/records/domain/field-record';

const input = (overrides: Partial<RecordInput> = {}): RecordInput => ({
  title: 'Roof inspection',
  notes: 'North side',
  status: 'draft',
  ...overrides,
});

describe('validateRecordInput', () => {
  it('trims title and notes', () => {
    expect(validateRecordInput(input({ title: '  Roof  ', notes: ' ok \n' }))).toEqual({
      title: 'Roof',
      notes: 'ok',
      status: 'draft',
    });
  });

  it.each([
    ['an empty title', input({ title: '   ' }), 'Title is required.'],
    ['a long title', input({ title: 'x'.repeat(TITLE_MAX_LENGTH + 1) }), 'Title must be'],
    ['long notes', input({ notes: 'x'.repeat(NOTES_MAX_LENGTH + 1) }), 'Notes must be'],
    ['an unknown status', input({ status: 'archived' as RecordStatus }), 'Choose a valid status.'],
  ])('rejects %s', (_, value, message) => {
    expect(() => validateRecordInput(value)).toThrow(message);
  });

  it('accepts a title at the maximum length', () => {
    expect(validateRecordInput(input({ title: 'x'.repeat(TITLE_MAX_LENGTH) })).title).toHaveLength(TITLE_MAX_LENGTH);
  });
});
