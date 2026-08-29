import { createArrayRenderer } from './array-renderer';
import { createStackRenderer, createQueueRenderer } from './stack-renderer';
import { createTreeRenderer } from './tree-renderer';
import { createListRenderer, createGraphRenderer } from './list-renderer';
import { registerRenderer } from './registry';

/**
 * Registers every renderer.
 *
 * One import with a side effect, rather than each page registering what it
 * thinks it needs: a lesson that declares `tree` and renders in a page that only
 * registered `array` would silently fall back to the wrong picture, and nothing
 * would report it.
 *
 * A heap is drawn by the tree renderer because a binary heap *is* a complete
 * binary tree stored in an array — the same picture, and the lesson's whole
 * point.
 */
registerRenderer('array', createArrayRenderer);
registerRenderer('stack', createStackRenderer);
registerRenderer('queue', createQueueRenderer);
registerRenderer('linked-list', createListRenderer);
registerRenderer('tree', createTreeRenderer);
registerRenderer('heap', createTreeRenderer);
registerRenderer('graph', createGraphRenderer);
