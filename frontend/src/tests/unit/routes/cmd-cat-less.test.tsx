import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showItemContent } from '../../../routes/shared/showItemContent';

// Mock the command registry so tests don't depend on real registry entries
vi.mock('../../../constants/command-registry', () => ({
    default: {
        registry: [
            {
                commandName: 'readme',
                helpText: 'A text file.',
                isExec: false,
                isDir: false,
                content: ['Line one of readme', 'Line two of readme'],
            },
            {
                commandName: 'history',
                helpText: 'An executable.',
                isExec: true,
                isDir: false,
            },
            {
                commandName: 'v5DoR_dynamic_keys',
                helpText: 'A directory.',
                isExec: false,
                isDir: true,
            },
            {
                commandName: 'empty-file',
                helpText: 'A file with no content array.',
                isExec: false,
                isDir: false,
                // no content property — triggers fallback
            },
        ],
    },
}));

describe('showItemContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns "Missing filename" when args is null', () => {
        const result = showItemContent(null);
        expect(result).toEqual(['Missing filename']);
    });

    it('returns "Missing filename" when args is an empty array', () => {
        const result = showItemContent([]);
        expect(result).toEqual(['Missing filename']);
    });

    it('returns "No such file or directory" for an unknown filename', () => {
        const result = showItemContent(['nonexistent']);
        expect(result).toEqual(['nonexistent: No such file or directory']);
    });

    it('returns directory message when matched item is a directory', () => {
        const result = showItemContent(['v5DoR_dynamic_keys']);
        expect(result).toEqual(['v5DoR_dynamic_keys is a directory']);
    });

    it('returns executable message when matched item is an executable', () => {
        const result = showItemContent(['history']);
        expect(result).toEqual(['history is an executable']);
    });

    it('returns file content when matched item has content', () => {
        const result = showItemContent(['readme']);
        expect(result).toEqual(['Line one of readme', 'Line two of readme']);
    });

    it('returns "No such file or directory" when matched item has no content', () => {
        const result = showItemContent(['empty-file']);
        expect(result).toEqual(['empty-file: No such file or directory']);
    });
});
