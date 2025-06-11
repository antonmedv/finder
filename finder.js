// License: MIT
// Author: Anton Medvedev <anton@medv.io>
// Source: https://github.com/antonmedv/finder
const acceptedAttrNames = new Set(['role', 'name', 'aria-label', 'rel', 'href']);
/** Check if attribute name and value are word-like. */
export function attr(name, value) {
    let nameIsOk = acceptedAttrNames.has(name);
    nameIsOk ||= name.startsWith('data-') && wordLike(name);
    let valueIsOk = wordLike(value) && value.length < 100;
    valueIsOk ||= value.startsWith('#') && wordLike(value.slice(1));
    return nameIsOk && valueIsOk;
}
/** Check if id name is word-like. */
export function idName(name) {
    return wordLike(name);
}
/** Check if class name is word-like. */
export function className(name) {
    return wordLike(name);
}
/** Check if tag name is word-like. */
export function tagName(name) {
    return true;
}
/** Finds unique CSS selectors for the given element. */
export function finder(input, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        throw new Error(`Can't generate CSS selector for non-element node type.`);
    }
    if (input.tagName.toLowerCase() === 'html') {
        return 'html';
    }
    const defaults = {
        root: document.body,
        idName: idName,
        className: className,
        tagName: tagName,
        attr: attr,
        timeoutMs: 200, // Much shorter timeout
        seedMinLength: 3,
        optimizedMinLength: 2,
        maxNumberOfPathChecks: 50, // Much lower limit
    };
    const startTime = new Date();
    const config = { ...defaults, ...options };
    const rootDocument = findRootDocument(config.root, defaults);
    
    // Ultra fast path: for any element with ID, assume it's unique
    const elementId = input.getAttribute('id');
    if (elementId) {
        try {
            return '#' + CSS.escape(elementId);
        } catch (e) {
            // Invalid selector, continue with normal search
        }
    }
    let foundPath;
    let count = 0;
    for (const candidate of search(input, config, rootDocument)) {
        const elapsedTimeMs = new Date().getTime() - startTime.getTime();
        if (elapsedTimeMs > config.timeoutMs ||
            count >= config.maxNumberOfPathChecks) {
            const fPath = fallback(input, rootDocument);
            if (!fPath) {
                throw new Error(`Timeout: Can't find a unique selector after ${config.timeoutMs}ms`);
            }
            return selector(fPath);
        }
        count++;
        if (unique(candidate, rootDocument)) {
            foundPath = candidate;
            break;
        }
    }
    if (!foundPath) {
        // Quick fallback without complex error handling
        const fPath = fallback(input, rootDocument);
        if (fPath) {
            return selector(fPath);
        }
        // Ultimate fallback: use tag + nth-child
        const tagName = input.tagName.toLowerCase();
        const nth = indexOf(input);
        return nth !== undefined ? `${tagName}:nth-child(${nth})` : tagName;
    }
    const optimized = [
        ...optimize(foundPath, input, config, rootDocument, startTime),
    ];
    optimized.sort(byPenalty);
    if (optimized.length > 0) {
        return selector(optimized[0]);
    }
    return selector(foundPath);
}
function* search(input, config, rootDocument) {
    const stack = [];
    let paths = [];
    let current = input;
    let i = 0;
    let totalGenerated = 0;
    
    while (current && current !== rootDocument && i < 8) { // Limit depth
        const level = tie(current, config);
        for (const node of level) {
            node.level = i;
        }
        stack.push(level);
        current = current.parentElement;
        i++;
        
        // Generate combinations but limit total count
        const newCombinations = [...combinations(stack)];
        paths.push(...newCombinations);
        totalGenerated += newCombinations.length;
        
        if (i >= config.seedMinLength) {
            paths.sort(byPenalty);
            for (const candidate of paths) {
                yield candidate;
            }
            paths = [];
            totalGenerated = 0;
        }
        
        // Early exit if too many combinations
        if (totalGenerated > 5000) {
            break;
        }
    }
    paths.sort(byPenalty);
    for (const candidate of paths) {
        yield candidate;
    }
}
function wordLike(name) {
    // Fast return for obviously generated IDs/classes (long or with numbers/special chars)
    if (name.length > 30 || /\d{3,}/.test(name) || /@/.test(name)) {
        return true;
    }
    
    if (/^[a-z\-]{3,}$/i.test(name)) {
        const words = name.split(/-|[A-Z]/);
        for (const word of words) {
            if (word.length <= 2) {
                return false;
            }
            if (/[^aeiou]{4,}/i.test(word)) {
                return false;
            }
        }
        return true;
    }
    return false;
}
function tie(element, config) {
    const level = [];
    const elementId = element.getAttribute('id');
    if (elementId) {
        // For elements with ID, only return the ID selector for maximum performance
        level.push({
            name: '#' + CSS.escape(elementId),
            penalty: 0,
        });
        return level; // Only ID, nothing else
    }
    
    // Limit class names to prevent explosion
    const maxClasses = Math.min(element.classList.length, 5);
    for (let i = 0; i < maxClasses; i++) {
        const name = element.classList[i];
        if (config.className(name)) {
            level.push({
                name: '.' + CSS.escape(name),
                penalty: 1,
            });
        }
    }
    
    // Limit attributes to prevent explosion
    const maxAttrs = Math.min(element.attributes.length, 3);
    for (let i = 0; i < maxAttrs; i++) {
        const attr = element.attributes[i];
        if (config.attr(attr.name, attr.value)) {
            level.push({
                name: `[${CSS.escape(attr.name)}="${CSS.escape(attr.value)}"]`,
                penalty: 2,
            });
        }
    }
    
    const tagName = element.tagName.toLowerCase();
    if (config.tagName(tagName)) {
        level.push({
            name: tagName,
            penalty: 5,
        });
        const index = indexOf(element, tagName);
        if (index !== undefined) {
            level.push({
                name: nthOfType(tagName, index),
                penalty: 10,
            });
        }
    }
    const nth = indexOf(element);
    if (nth !== undefined) {
        level.push({
            name: nthChild(tagName, nth),
            penalty: 50,
        });
    }
    
    // Sort by penalty and limit total selectors per level
    level.sort((a, b) => a.penalty - b.penalty);
    return level.slice(0, 15);
}
function selector(path) {
    let node = path[0];
    let query = node.name;
    for (let i = 1; i < path.length; i++) {
        const level = path[i].level || 0;
        if (node.level === level - 1) {
            query = `${path[i].name} > ${query}`;
        }
        else {
            query = `${path[i].name} ${query}`;
        }
        node = path[i];
    }
    return query;
}
function penalty(path) {
    return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
}
function byPenalty(a, b) {
    return penalty(a) - penalty(b);
}
function indexOf(input, tagName) {
    const parent = input.parentNode;
    if (!parent) {
        return undefined;
    }
    let child = parent.firstChild;
    if (!child) {
        return undefined;
    }
    let i = 0;
    while (child) {
        if (child.nodeType === Node.ELEMENT_NODE &&
            (tagName === undefined ||
                child.tagName.toLowerCase() === tagName)) {
            i++;
        }
        if (child === input) {
            break;
        }
        child = child.nextSibling;
    }
    return i;
}
function fallback(input, rootDocument) {
    let i = 0;
    let current = input;
    const path = [];
    while (current && current !== rootDocument) {
        const tagName = current.tagName.toLowerCase();
        const index = indexOf(current, tagName);
        if (index === undefined) {
            return;
        }
        path.push({
            name: nthOfType(tagName, index),
            penalty: NaN,
            level: i,
        });
        current = current.parentElement;
        i++;
    }
    if (unique(path, rootDocument)) {
        return path;
    }
}
function nthChild(tagName, index) {
    if (tagName === 'html') {
        return 'html';
    }
    return `${tagName}:nth-child(${index})`;
}
function nthOfType(tagName, index) {
    if (tagName === 'html') {
        return 'html';
    }
    return `${tagName}:nth-of-type(${index})`;
}
function* combinations(stack, path = []) {
    // Limit combinations to prevent memory explosion
    const maxCombinations = 1000;
    let generated = 0;
    
    if (stack.length === 0) {
        yield path;
        return;
    }

    // Use iterative approach to avoid stack overflow
    const workStack = [{ stackIndex: 0, currentPath: [...path] }];

    while (workStack.length > 0 && generated < maxCombinations) {
        const current = workStack.pop();
        
        if (current.stackIndex >= stack.length) {
            yield current.currentPath;
            generated++;
            continue;
        }

        const currentLevel = stack[current.stackIndex];
        // Limit nodes per level to prevent explosion
        const maxNodes = Math.min(currentLevel.length, 10);
        
        for (let i = maxNodes - 1; i >= 0; i--) {
            if (generated >= maxCombinations) break;
            
            const node = currentLevel[i];
            const newPath = [...current.currentPath, node];
            
            workStack.push({
                stackIndex: current.stackIndex + 1,
                currentPath: newPath
            });
        }
    }
}
function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
        return rootNode;
    }
    if (rootNode === defaults.root) {
        return rootNode.ownerDocument;
    }
    return rootNode;
}
function unique(path, rootDocument) {
    const css = selector(path);
    switch (rootDocument.querySelectorAll(css).length) {
        case 0:
            throw new Error(`Can't select any node with this selector: ${css}`);
        case 1:
            return true;
        default:
            return false;
    }
}
function* optimize(path, input, config, rootDocument, startTime) {
    if (path.length > 2 && path.length > config.optimizedMinLength) {
        for (let i = 1; i < path.length - 1; i++) {
            const elapsedTimeMs = new Date().getTime() - startTime.getTime();
            if (elapsedTimeMs > config.timeoutMs) {
                return;
            }
            const newPath = [...path];
            newPath.splice(i, 1);
            if (unique(newPath, rootDocument) &&
                rootDocument.querySelector(selector(newPath)) === input) {
                yield newPath;
                yield* optimize(newPath, input, config, rootDocument, startTime);
            }
        }
    }
}