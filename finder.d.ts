/** Check if attribute name and value are word-like. */
export declare function attr(name: string, value: string): boolean;
/** Check if id name is word-like. */
export declare function idName(name: string): boolean;
/** Check if class name is word-like. */
export declare function className(name: string): boolean;
/** Check if tag name is word-like. */
export declare function tagName(name: string): boolean;
/** Configuration options for the finder. */
export type Options = {
    /** The root element to start the search from. */
    root: Element;
    /** Function that determines if an id name may be used in a selector. */
    idName: (name: string) => boolean;
    /** Function that determines if a class name may be used in a selector. */
    className: (name: string) => boolean;
    /** Function that determines if a tag name may be used in a selector. */
    tagName: (name: string) => boolean;
    /** Function that determines if an attribute may be used in a selector. */
    attr: (name: string, value: string) => boolean;
    /** Timeout to search for a selector. */
    timeoutMs: number;
    /** Minimum length of levels in fining selector. */
    seedMinLength: number;
    /** Minimum length for optimising selector. */
    optimizedMinLength: number;
    /** Maximum number of path checks. */
    maxNumberOfPathChecks: number;
};
/** Finds unique CSS selectors for the given element. */
export declare function finder(initialInput: Element | Element[], options?: Partial<Options>): string;
