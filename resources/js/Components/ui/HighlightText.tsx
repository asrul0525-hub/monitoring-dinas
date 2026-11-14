function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightTextProps {
    text: string;
    query?: string;
}

/**
 * Menyorot kemunculan kata kunci pencarian secara case-insensitive
 * tanpa menggunakan dangerouslySetInnerHTML.
 */
export function HighlightText({ text, query }: HighlightTextProps) {
    const trimmed = query?.trim() ?? '';
    if (!trimmed) return <>{text}</>;

    const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'ig');
    const parts = text.split(regex);
    if (parts.length <= 1) return <>{text}</>;

    return (
        <>
            {parts.map((part, idx) =>
                idx % 2 === 1 ? (
                    <mark key={idx} className="keyword-highlight">
                        {part}
                    </mark>
                ) : (
                    <span key={idx}>{part}</span>
                ),
            )}
        </>
    );
}
