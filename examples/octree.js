!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Octree=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Node = require("./node"),
    Item = require("./item"),
    Octree = require("./octree");

Octree.Node = Node;
Octree.Item = Item;

module.exports = Octree;



},{"./item":2,"./node":3,"./octree":4}],2:[function(require,module,exports){
/**
 * @param x {number} X position
 * @param y {number} Y position
 * @param z {number} Z position
 * @param [ex] {number} x extent
 * @param [ey] {number} y extent
 * @param [ez] {number} z extent
 * @constructor
 */
function Item(x, y, z, ex, ey, ez) {
    this.x = x;
    this.y = y;
    this.z = z;

    if (ex !== undefined) {
        this.type = Item.AABB;
        this.ex = ex;
        this.ey = ey;
        this.ez = ez;
    }
}

Item.POINT = 0;
Item.AABB = 1;

var p = Item.prototype;

p.type = Item.POINT;
p.flag = 0;

p.x = 0;
p.y = 0;
p.z = 0;

p.ex = 0;
p.ey = 0;
p.ez = 0;

module.exports = Item;
},{}],3:[function(require,module,exports){
//single set bit index lookup table
var bitIndex = new Int8Array(129);
bitIndex[2] = 1;
bitIndex[4] = 2;
bitIndex[8] = 3;
bitIndex[16] = 4;
bitIndex[32] = 5;
bitIndex[64] = 6;
bitIndex[128] = 7;

var indexToKey = new Array(8);
indexToKey[0] = "subnode0";
indexToKey[1] = "subnode1";
indexToKey[2] = "subnode2";
indexToKey[3] = "subnode3";
indexToKey[4] = "subnode4";
indexToKey[5] = "subnode5";
indexToKey[6] = "subnode6";
indexToKey[7] = "subnode7";

//precalculated masks for all p0 and p1 point variations
function p(p0, p1) {
    return (1 << p0) |
        (1 << (p0 & 1 | p1 & 6)) |
        (1 << (p0 & 2 | p1 & 5)) |
        (1 << (p0 & 3 | p1 & 4)) |
        (1 << (p0 & 4 | p1 & 3)) |
        (1 << (p0 & 5 | p1 & 2)) |
        (1 << (p0 & 6 | p1 & 1)) |
        (1 << p1);
}

var intersectionMaskTable = new Uint8Array(64);
for (var i = 0; i < 64; i++) {
    var p0 = i >> 3;
    var p1 = i & 7;
    intersectionMaskTable[i] = p(p0, p1);
}

function intersectionMask(node, item) {
    //p are bounding box min & max point position inside node.
    //p can have value of 0-7, it's an index of node's subnode,
    //e.g. x=0,y=0,z=0 is 0 index subnode, x=1,y=1,z=1 is 7.
    //or simply x is first bit of index, y - second, z - third.
    // for Z=0 subnodes are indexed like this. for Z=1 each index +4.
    //  ---------
    //  | 0 | 1 |
    //  |---|---|
    //  | 2 | 3 |
    //  ---------
    //
    var p0 = 0,
        p1 = 0;

    if (item.z - item.ez >= node.z) {
        p0 = 4;
        p1 = 4;
    } else if (item.z + item.ez >= node.z) {
        p1 = 4;
    }

    if (item.y - item.ey >= node.y) {
        p0 |= 2;
        p1 |= 2;
    } else if (item.y + item.ey >= node.y) {
        p1 |= 2;
    }

    if (item.x - item.ex >= node.x) {
        p0 |= 1;
        p1 |= 1;
    } else if (item.x + item.ex >= node.x) {
        p1 |= 1;
    }

    return intersectionMaskTable[p0 * 8 + p1];
}

/**
 * Creates subnode with set bounds accordingly to parent node and subnodes position defined by index.
 * @param tree {Octree}
 * @param parent {Node}
 * @param index
 * @returns {*}
 */
function createSubnode(tree, parent, index) {
    var subnode = new Node(tree);

    subnode.ex = parent.ex / 2;
    subnode.ey = parent.ey / 2;
    subnode.ez = parent.ez / 2;
    subnode.x = (parent.x - subnode.ex) + parent.ex * (index & 1);
    subnode.y = (parent.y - subnode.ey) + parent.ey * ((index & 2) >> 1);
    subnode.z = (parent.z - subnode.ez) + parent.ez * ((index & 4) >> 2);
    subnode.depth = parent.depth + 1;
    subnode.parent = parent;

    parent[indexToKey[index]] = subnode;
    parent.nodesCount++;
    parent.nodesMask |= (1 << index);

    return subnode;
}

/**
 * Insert item into given node.
 * @param tree {Octree}
 * @param node {Node} Node to insert in
 * @param {Item} item Item to insert
 */
function insert(tree, node, item) {
    node.count++;

    if (node.type === Node.LEAF) {
        node.items.push(item);

        if (node.count >= tree.treshold)
            split(tree, node);
    } else {
        var mask = intersectionMask(node, item),
            nodesMask = node.nodesMask;

        for(var i = 0; i < 8; i++) {
            if (mask & (1 << i))
                if (nodesMask & (1 << i)) {
                    insert(tree, node[indexToKey[i]], item);
                } else {
                    insert(tree, createSubnode(tree, node, i), item);
                }
        }
    }
}

/**
 * Remove item from given node.
 * @param node Node to remove from
 * @param {BoundingBox} item Item to remove
 */
function remove(tree, node, item) {
    if (node.type === Node.LEAF) {
        var index = node.items.indexOf(item);

        if (index !== -1) {
            node.items.splice(index, 1);
            node.count--;

            return true;
        } else
            return false;
    } else {
        var r = true,
            mask = intersectionMask(node, item),
            subnode;

        for(var i = 0; i < 8; i++) {
            if (mask & (1 << i)) {
                subnode = node[indexToKey[i]];

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node[indexToKey[i]] = null;
                        node.nodesCount--;
                        node.nodesMask ^= (1 << i);
                    }
                } else {
                    r = false;
                }
            }
        }


        if (r === true)
            node.count--;

        if (node.count < node.tree.treshold)
            merge(node);

        return r;
    }
}

/**
 * Splits given node into 8 subnodes. Empty subnodes are not created.
 * @param {Octree} tree
 * @param {Node} node
 */
function split(tree, node) {
    if (node.depth > tree.maxDepth)
        return;

    if (node.ex <= node.tree.tearDrop)
        return;

    var items = node.items,
        itemsCount = items.length,
        item, mask, nodesMask;

    node.type = Node.BRANCH;
    node.items = null;

    for (var j = 0; j < itemsCount; j++) {
        item = items[j];
        mask = intersectionMask(node, item);
        nodesMask = node.nodesMask;

        for (var i = 0; i < 8; i++) {
            if (mask & (1 << i))
                if (nodesMask & (1 << i)) {
                    insert(tree, node[indexToKey[i]], item);
                } else {
                    insert(tree, createSubnode(tree, node, i), item);
                }
        }
    }
}

/**
 * Merges subnodes of given node.
 * @param {Octree} tree
 * @param {Node} node
 */
function merge(node) {
    var nodeKey,
        childNode,
        mask = node.nodesMask,
        items,
        childNodeItems,
        childNodeItemsLen,
        childNodeItem;

    node.type = Node.LEAF;
    node.nodesCount = 0;
    node.nodesMask = 0;

    for (var i = 0; i < 8; i++) {
        if (mask & (1 << i)) {
            nodeKey = indexToKey[i]
            childNode = node[nodeKey];

            if (node.items === null) {
                node.items = childNode.items;
            } else {
                items = node.items;
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node[nodeKey] = null;
        }
    }
}


/**
 * Return array of items near giver item.
 * @param node
 * @param item
 * @param {Array} resultArray
 * @returns {*}
 */
function retrieve(node, item, resultArray) {
    var i;

    if (node.type === Node.BRANCH) {
        var mask = intersectionMask(node, item);

        for(i = 0; i < 8; i++){
            if(mask & (1 << i))
                retrieve(node[indexToKey[i]], item, resultArray);
        }
    } else {
        var items = node.items,
            itemsLen = items.length,
            resultItem;

        for (i = 0; i < itemsLen; i++) {
            resultItem = items[i];

            if (resultItem === item)
                continue;

            resultItem.flag = 1;
            resultArray.push(resultItem);
        }
    }
}

/**
 * @param node
 * @param index Index of subnode where the current node will be placed
 */
function grow(tree, node, index) {
    if (node.parent !== null)
        return false;

    var ex = node.ex * 2,
        ey = node.ey * 2,
        ez = node.ez * 2,
        x = node.x + node.ex - ex * (index & 1), //001 extract x
        y = node.y + node.ey - ey * ((index & 2) >> 1), //010 extract y
        z = node.z + node.ez - ez * ((index & 4) >> 2), //100 extract z
        node2;

    if (node.type === Node.BRANCH) {
        node2 = new Node(tree);
        node2.x = x;
        node2.y = y;
        node2.z = z;
        node2.ex = ex;
        node2.ey = ey;
        node2.ez = ez;
        split(tree, node2);
        node2[indexToKey[index]] = node;
        node2.count = node.count;
        node2.nodesCount = 1;
        node2.nodesMask = 1 << index;
        node.parent = node2;
        updateDepth(tree, node);
        return node2;
    } else {
        //Expand existing root node
        node.x = x;
        node.y = y;
        node.z = z;
        node.ex = ex;
        node.ey = ey;
        node.ez = ez;
        return node;
    }
}

function shrink(tree, node) {
    if (node.parent === null && node.nodesCount === 1) {
        var childNode = node[indexToKey[bitIndex[node.nodesMask]]];
        childNode.parent.depth = -1;
        updateDepth(tree, childNode);
        childNode.parent = null;
        return childNode;
    } else
        return false;
}

function updateDepth(tree, node) {
    node.depth = node.parent.depth + 1;

    if (node.type === Node.BRANCH) {
        if (node.depth > tree.maxDepth)
            merge(node);
        else {
            var nodesMask = node.nodesMask;

            for(var i = 0; i < 8; i++)
            if (nodesMask & (1 << i))
                updateDepth(tree, node[indexToKey[i]]);
        }
    }
}

/**
 * @param {Octree} tree
 * @constructor
 */
function Node(tree) {
    this.tree = tree;
    this.type = 0;
    this.items = [];
    this.count = 0;
    this.nodesCount = 0;
    this.nodesMask = 0;
    this.parent = null;
    this.depth = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.ex = 0;
    this.ey = 0;
    this.ez = 0;

    this.subnode0 = null;
    this.subnode1 = null;
    this.subnode2 = null;
    this.subnode3 = null;
    this.subnode4 = null;
    this.subnode5 = null;
    this.subnode6 = null;
    this.subnode7 = null;
}

Node.LEAF = 0;
Node.BRANCH = 1;

Node.indexToKey = indexToKey;

Node.prototype.x = 0;

Node.prototype.insert = function (item) {
    return insert(this.tree, this, item);
};

Node.prototype.remove = function (item) {
    return remove(this.tree, this, item);
};

Node.prototype.retrieve = function (item, out) {
    return retrieve(this, item, out);
};

Node.prototype.grow = function (index) {
    return grow(this.tree, this, index);
};

Node.prototype.shrink = function () {
    return shrink(this.tree, this);
};

module.exports = Node;
},{}],4:[function(require,module,exports){
var Node = require("./node", "./item");

/**
 * @param {int} maxDepth
 * @param {int} threshold
 * @param {int} tearDrop
 * @constructor
 */
function Octree(maxDepth, threshold, tearDrop) {
    this.maxDepth = maxDepth || 8;
    this.treshold = threshold || 32;
    this.tearDrop = tearDrop || 1;
}

var p = Octree.prototype;

/**
 * Limit when node should subdivide
 * @type {int}
 */
p.treshold = null;

/**
 * @type {int}
 */
p.maxDepth = null;

/**
 * Minimal size of node bounds
 * @type {number}
 */
p.tearDrop = 0;

/**
 * Root node of tree
 * @type {Node}
 */
p.root = null;

/**
 * Inserts bounding box into octree.
 * @param {Item} item
 * @returns {*}
 */
p.insert = function (item) {
    var root = this.root;

    //setup tree's root node
    if (root === null) {
        root = this.root = new Node(this);
        root.x = item.x;
        root.y = item.y;
        root.z = item.z;
        root.ex = item.ex + 1;
        root.ey = item.ey + 1;
        root.ez = item.ez + 1;
    }

    //insert item in a subnode, if item is outside of tree's root node,
    //then tree should expand
    if ((item.x - item.ex) >= (root.x - root.ex) &&
        (item.x + item.ex) <= (root.x + root.ex) &&
        (item.y - item.ey) >= (root.y - root.ey) &&
        (item.y + item.ey) <= (root.y + root.ey) &&
        (item.z - item.ez) >= (root.z - root.ez) &&
        (item.z + item.ez) <= (root.z + root.ez)) {
        root.insert(item);
    } else {
        var dx = root.x - item.x,
            dy = root.y - item.y,
            dz = root.z - item.z;
        this.grow(dx, dy, dz);
        this.insert(item);
    }
};

/**
 * Remove bounding box from octree
 * @param {Item} item
 * @returns {boolean} True on success, else false.
 */
p.remove = function (item) {
    var root = this.root;

    if ((item.x - item.ex) >= (root.x - root.ex) &&
        (item.x + item.ex) <= (root.x + root.ex) &&
        (item.y - item.ey) >= (root.y - root.ey) &&
        (item.y + item.ey) <= (root.y + root.ey) &&
        (item.z - item.ez) >= (root.z - root.ez) &&
        (item.z + item.ez) <= (root.z + root.ez)) {
        var r = root.remove(item);
        if (r === true) {
            this.shrink()
        }

        if (root.count === 0)
            this.root = null;

        return r;
    }

    return false;
};

/**
 * Returns array of bounding boxes, that lies near given bounding box.
 * @param {Item} item
 * @param {Array} out Array that will be filled with result items
 * @returns {Item[]}
 */
p.retrieve = function (item, out) {
    out = out || [];

    if (this.root !== null) {
        this.root.retrieve(item, out);
        var l = out.length;

        for (var i = 0, j = 0; i < l; i++) {
            var item = out[i];

            if (item.flag & 1) { //if item is not flagged then it's a duplicate and the item is in array already.
                item.flag = 0;
                out[j++] = item;
            }

        }

        //now, remove all garbage(duplicate indexes in the tail of array) from array
        out.splice(j, i - j);

    }
    return out;
};

p.grow = function (x, y, z) {
    if (x >= 0)
        x = 1;
    else
        x = 0;

    if (y >= 0)
        y = 1;
    else
        y = 0;

    if (z >= 0)
        z = 1;
    else
        z = 0;

    var index = (z << 2) + (y << 1) + x;

    this.root = this.root.grow(index);
};

p.shrink = function () {
    var newRoot = this.root.shrink();
    if (newRoot !== false)
        this.root = newRoot;
};


module.exports = Octree;

},{"./node":3}]},{},[1])(1)
});