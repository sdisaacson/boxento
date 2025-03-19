export type ChangeType = 'added' | 'changed' | 'fixed' | 'deprecated' | 'removed';

export interface ChangelogEntry {
    type: ChangeType;
    description: string;
}

export interface ChangelogVersion {
    version: string;
    date: string;
    changes: {
        [category: string]: string[];
    };
}

export interface ChangelogData {
    versions: ChangelogVersion[];
} 