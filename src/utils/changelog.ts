import { ChangelogData } from '@/types/changelog';

export const parseChangelog = async (): Promise<ChangelogData> => {
    try {
        const response = await fetch('/CHANGELOG.md');
        const text = await response.text();
        
        // Split the content by sections
        const sections = text.split('\n## ').slice(1); // Skip the header
        const versions = sections.map(section => {
            const lines = section.split('\n');
            const dateTitle = lines[0].trim(); // e.g., "March 19, 2025"
            
            const changes: { [key: string]: string[] } = {};
            let currentCategory = '';
            
            lines.slice(1).forEach(line => {
                if (line.startsWith('### ')) {
                    currentCategory = line.replace('### ', '').trim();
                    changes[currentCategory] = [];
                } else if (line.startsWith('• ')) {
                    const change = line.replace('• ', '').trim();
                    if (currentCategory && change) {
                        changes[currentCategory].push(change);
                    }
                } else if (line.startsWith('  - ')) {
                    // Handle sub-bullets for widget list
                    const change = line.replace('  - ', '').trim();
                    if (currentCategory && change) {
                        changes[currentCategory].push(change);
                    }
                }
            });
            
            return {
                version: dateTitle.split(' ')[0] + ' ' + dateTitle.split(' ')[1], // e.g., "March 19"
                date: dateTitle,
                changes
            };
        });
        
        return { versions };
    } catch (error) {
        console.error('Error parsing changelog:', error);
        return { versions: [] };
    }
}; 