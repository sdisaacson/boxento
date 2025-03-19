import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChangelogData } from '@/types/changelog';
import { parseChangelog } from '@/utils/changelog';
import { Bell, Sparkles } from 'lucide-react';

const LAST_VIEWED_KEY = 'boxento-changelog-last-viewed';

export function Changelog() {
    const [changelog, setChangelog] = useState<ChangelogData>({ versions: [] });
    const [hasNewUpdates, setHasNewUpdates] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const loadChangelog = async () => {
            const data = await parseChangelog();
            setChangelog(data);
            
            // Check if there are new updates
            const lastViewed = localStorage.getItem(LAST_VIEWED_KEY);
            if (data.versions.length > 0) {
                const latestVersion = data.versions[0];
                const latestVersionDate = new Date(latestVersion.date).getTime();
                const lastViewedDate = lastViewed ? parseInt(lastViewed) : 0;
                
                setHasNewUpdates(latestVersionDate > lastViewedDate);
            }
        };
        loadChangelog();
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && changelog.versions.length > 0) {
            // Mark as viewed
            const latestVersion = changelog.versions[0];
            const latestVersionDate = new Date(latestVersion.date).getTime();
            localStorage.setItem(LAST_VIEWED_KEY, latestVersionDate.toString());
            setHasNewUpdates(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="relative h-9 w-9 rounded-full"
                >
                    <Bell className="h-4 w-4" />
                    {hasNewUpdates && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        What's New
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[450px] pr-4 -mr-4">
                    <div className="space-y-12 pr-4">
                        {changelog.versions.map((version, versionIndex) => (
                            <div key={version.date} className="relative">
                                <div className="sticky top-0 z-10 mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
                                    <h3 className="text-xl font-semibold tracking-tight">
                                        {version.date}
                                    </h3>
                                </div>
                                <div className="space-y-8">
                                    {Object.entries(version.changes).map(([category, changes]) => (
                                        <div key={category} className="space-y-4">
                                            <h4 className="text-base font-medium text-primary">
                                                {category}
                                            </h4>
                                            <ul className="space-y-3 pl-1">
                                                {changes.map((change, index) => (
                                                    <li 
                                                        key={index} 
                                                        className={`relative pl-5 text-muted-foreground ${
                                                            change.startsWith('- ') ? 'ml-4' : ''
                                                        }`}
                                                    >
                                                        <span className="absolute left-0 top-[9px] h-1.5 w-1.5 rounded-full bg-primary/70"></span>
                                                        {change.startsWith('- ') ? change.slice(2) : change}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                {versionIndex < changelog.versions.length - 1 && (
                                    <Separator className="mt-8 mb-4" />
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
} 