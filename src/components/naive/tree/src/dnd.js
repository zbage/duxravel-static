import { h } from 'vue';
export function renderDropMark({ position, offsetLevel, indent, el }) {
    const style = {
        position: 'absolute',
        boxSizing: 'border-box',
        right: 0
    };
    if (position === 'inside') {
        style.left = 0;
        style.top = 0;
        style.bottom = 0;
        style.borderRadius = 'inherit';
        style.boxShadow = 'inset 0 0 0 2px var(--drop-mark-color)';
    }
    else {
        const cssPosition = position === 'before' ? 'top' : 'bottom';
        style[cssPosition] = 0;
        // The left prop should be modified when tree's style is changed
        // Maybe it is possible to use content left
        style.left = `${el.offsetLeft + 6 - offsetLevel * indent}px`;
        style.height = '2px';
        style.backgroundColor = 'var(--drop-mark-color)';
        style.transformOrigin = cssPosition;
        style.borderRadius = '1px';
        style.transform =
            position === 'before' ? 'translateY(-4px)' : 'translateY(4px)';
    }
    return h("div", { style: style });
}
export function defaultAllowDrop({ dropPosition, node }) {
    if (node.isLeaf === false)
        return true;
    if (node.children) {
        return true;
    }
    return dropPosition !== 'inside';
}
