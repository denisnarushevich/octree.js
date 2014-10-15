define(function () {
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

    //I bet some values can be precalculated and stored in table.
    var intersectionMask2 = function (node, item) {
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

        if (p0 === p1) {
            return 1 << p0;
        } else {
            return (1 << p0) |
                (1 << (p0 & 1 | p1 & 6)) |
                (1 << (p0 & 2 | p1 & 5)) |
                (1 << (p0 & 3 | p1 & 4)) |
                (1 << (p0 & 4 | p1 & 3)) |
                (1 << (p0 & 5 | p1 & 2)) |
                (1 << (p0 & 6 | p1 & 1)) |
                (1 << p1);

        }
    }

    //precalculated masks for all p0 and p1 point variantions
    //mask can be calculated like this:
    /*     (1 << p0) |
     (1 << (p0 & 1 | p1 & 6)) |
     (1 << (p0 & 2 | p1 & 5)) |
     (1 << (p0 & 3 | p1 & 4)) |
     (1 << (p0 & 4 | p1 & 3)) |
     (1 << (p0 & 5 | p1 & 2)) |
     (1 << (p0 & 6 | p1 & 1)) |
     (1 << p1);
     */
    var intersectionMaskTable = new Uint8Array(64);
    intersectionMaskTable[0] = 1;
    intersectionMaskTable[1] = 3;
    intersectionMaskTable[2] = 5;
    intersectionMaskTable[3] = 15;
    intersectionMaskTable[4] = 17;
    intersectionMaskTable[5] = 51;
    intersectionMaskTable[6] = 85;
    intersectionMaskTable[7] = 255;
    intersectionMaskTable[8] = 3;
    intersectionMaskTable[9] = 2;
    intersectionMaskTable[10] = 15;
    intersectionMaskTable[11] = 10;
    intersectionMaskTable[12] = 51;
    intersectionMaskTable[13] = 34;
    intersectionMaskTable[14] = 255;
    intersectionMaskTable[15] = 170;
    intersectionMaskTable[16] = 5;
    intersectionMaskTable[17] = 15;
    intersectionMaskTable[18] = 4;
    intersectionMaskTable[19] = 12;
    intersectionMaskTable[20] = 85;
    intersectionMaskTable[21] = 255;
    intersectionMaskTable[22] = 68;
    intersectionMaskTable[23] = 204;
    intersectionMaskTable[24] = 15;
    intersectionMaskTable[25] = 10;
    intersectionMaskTable[26] = 12;
    intersectionMaskTable[27] = 8;
    intersectionMaskTable[28] = 255;
    intersectionMaskTable[29] = 170;
    intersectionMaskTable[30] = 204;
    intersectionMaskTable[31] = 136;
    intersectionMaskTable[32] = 17;
    intersectionMaskTable[33] = 51;
    intersectionMaskTable[34] = 85;
    intersectionMaskTable[35] = 255;
    intersectionMaskTable[36] = 16;
    intersectionMaskTable[37] = 48;
    intersectionMaskTable[38] = 80;
    intersectionMaskTable[39] = 240;
    intersectionMaskTable[40] = 51;
    intersectionMaskTable[41] = 34;
    intersectionMaskTable[42] = 255;
    intersectionMaskTable[43] = 170;
    intersectionMaskTable[44] = 48;
    intersectionMaskTable[45] = 32;
    intersectionMaskTable[46] = 240;
    intersectionMaskTable[47] = 160;
    intersectionMaskTable[48] = 85;
    intersectionMaskTable[49] = 255;
    intersectionMaskTable[50] = 68;
    intersectionMaskTable[51] = 204;
    intersectionMaskTable[52] = 80;
    intersectionMaskTable[53] = 240;
    intersectionMaskTable[54] = 64;
    intersectionMaskTable[55] = 192;
    intersectionMaskTable[56] = 255;
    intersectionMaskTable[57] = 170;
    intersectionMaskTable[58] = 204;
    intersectionMaskTable[59] = 136;
    intersectionMaskTable[60] = 240;
    intersectionMaskTable[61] = 160;
    intersectionMaskTable[62] = 192;
    intersectionMaskTable[63] = 128;

    var intersectionMask = function (node, item) {
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

    /**
     * Creates subnode with set bounds accordingly to parent node and subnodes position defined by index.
     * @param node
     * @param index
     * @returns {*}
     */
    var createSubnode = function (tree, parent, index) {
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
     * @param node Node to insert in
     * @param {BoundingBox} item Item to insert
     */
    var insert = function (tree, node, item) {
        node.count++;

        if (node.type === Node.LEAF) {
            node.items.push(item);

            if (node.count >= tree.treshold)
                split(tree, node);
        } else {
            var mask = intersectionMask(node, item),
                nodesMask = node.nodesMask;

            if (mask & 1)
                if (nodesMask & 1) {
                    insert(tree, node.subnode0, item);
                } else {
                    insert(tree, createSubnode(tree, node, 0), item);
                }

            if (mask & 2)
                if (nodesMask & 2) {
                    insert(tree, node.subnode1, item);
                } else {
                    insert(tree, createSubnode(tree, node, 1), item);
                }

            if (mask & 4)
                if (nodesMask & 4) {
                    insert(tree, node.subnode2, item);
                } else {
                    insert(tree, createSubnode(tree, node, 2), item);
                }

            if (mask & 8)
                if (nodesMask & 8) {
                    insert(tree, node.subnode3, item);
                } else {
                    insert(tree, createSubnode(tree, node, 3), item);
                }

            if (mask & 16)
                if (nodesMask & 16) {
                    insert(tree, node.subnode4, item);
                } else {
                    insert(tree, createSubnode(tree, node, 4), item);
                }

            if (mask & 32)
                if (nodesMask & 32) {
                    insert(tree, node.subnode5, item);
                } else {
                    insert(tree, createSubnode(tree, node, 5), item);
                }

            if (mask & 64)
                if (nodesMask & 64) {
                    insert(tree, node.subnode6, item);
                } else {
                    insert(tree, createSubnode(tree, node, 6), item);
                }

            if (mask & 128)
                if (nodesMask & 128) {
                    insert(tree, node.subnode7, item);
                } else {
                    insert(tree, createSubnode(tree, node, 7), item);
                }

        }
    }

    /**
     * Remove item from given node.
     * @param node Node to remove from
     * @param {BoundingBox} item Item to remove
     */
    var remove = function (tree, node, item) {
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

            if (mask & 1) {
                subnode = node.subnode0;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode0 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 1;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 2) {
                subnode = node.subnode1;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode1 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 2;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 4) {
                subnode = node.subnode2;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode2 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 4;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 8) {
                subnode = node.subnode3;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode3 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 8;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 16) {
                subnode = node.subnode4;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode4 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 16;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 32) {
                subnode = node.subnode5;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode5 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 32;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 64) {
                subnode = node.subnode6;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode6 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 64;
                    }
                } else {
                    r = false;
                }
            }

            if (mask & 128) {
                subnode = node.subnode7;

                if (remove(tree, subnode, item)) {
                    if (subnode.count === 0) {
                        node.subnode7 = null;
                        node.nodesCount--;
                        node.nodesMask ^= 128;
                    }
                } else {
                    r = false;
                }
            }


            if (r === true)
                node.count--;

            if (node.count < node.tree.treshold)
                merge(tree, node);

            return r;
        }
    }

    /**
     * Splits given node into 8 subnodes. Empty subnodes are not created.
     * @param node
     */
    var split = function (tree, node) {
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

            if (mask & 1)
                if (nodesMask & 1) {
                    insert(tree, node.subnode0, item);
                } else {
                    insert(tree, createSubnode(tree, node, 0), item);
                }

            if (mask & 2)
                if (nodesMask & 2) {
                    insert(tree, node.subnode1, item);
                } else {
                    insert(tree, createSubnode(tree, node, 1), item);
                }

            if (mask & 4)
                if (nodesMask & 4) {
                    insert(tree, node.subnode2, item);
                } else {
                    insert(tree, createSubnode(tree, node, 2), item);
                }

            if (mask & 8)
                if (nodesMask & 8) {
                    insert(tree, node.subnode3, item);
                } else {
                    insert(tree, createSubnode(tree, node, 3), item);
                }

            if (mask & 16)
                if (nodesMask & 16) {
                    insert(tree, node.subnode4, item);
                } else {
                    insert(tree, createSubnode(tree, node, 4), item);
                }

            if (mask & 32)
                if (nodesMask & 32) {
                    insert(tree, node.subnode5, item);
                } else {
                    insert(tree, createSubnode(tree, node, 5), item);
                }

            if (mask & 64)
                if (nodesMask & 64) {
                    insert(tree, node.subnode6, item);
                } else {
                    insert(tree, createSubnode(tree, node, 6), item);
                }

            if (mask & 128)
                if (nodesMask & 128) {
                    insert(tree, node.subnode7, item);
                } else {
                    insert(tree, createSubnode(tree, node, 7), item);
                }
        }
    }

    /**
     * Merges subnodes of given node.
     * @param node
     */
    var merge = function (tree, node) {
        var childNode,
            mask = node.nodesMask,
            items,
            childNodeItems,
            childNodeItemsLen,
            childNodeItem;

        node.type = Node.LEAF;
        //node.nodes = null;
        node.nodesCount = 0;
        node.nodesMask = 0;

        if (mask & 1) {
            childNode = node.subnode0;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode0 = null;
        }

        if (mask & 2) {
            childNode = node.subnode1;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode1 = null;
        }

        if (mask & 4) {
            childNode = node.subnode2;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode2 = null;
        }

        if (mask & 8) {
            childNode = node.subnode3;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode3 = null;
        }

        if (mask & 16) {
            childNode = node.subnode4;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode4 = null;
        }

        if (mask & 32) {
            childNode = node.subnode5;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode5 = null;
        }

        if (mask & 64) {
            childNode = node.subnode6;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode6 = null;
        }

        if (mask & 128) {
            childNode = node.subnode7;

            if (node.items === null) {
                node.items = items = childNode.items;
            } else {
                childNodeItems = childNode.items;
                childNodeItemsLen = childNodeItems.length;

                for (var j = 0; j < childNodeItemsLen; j++)
                    if (items.indexOf(childNodeItem = childNodeItems[j]) === -1)
                        items.push(childNodeItem);
            }

            node.subnode7 = null;
        }
    }


    /**
     * Return array of items near giver item.
     * @param node
     * @param item
     * @param {Array} resultArray
     * @returns {*}
     */
    var retrieve = function (node, item, resultArray) {
        if (node.type === Node.BRANCH) {
            var mask = intersectionMask(node, item);

            if (mask & 1)
                retrieve(node.subnode0, item, resultArray);

            if (mask & 2)
                retrieve(node.subnode1, item, resultArray);

            if (mask & 4)
                retrieve(node.subnode2, item, resultArray);

            if (mask & 8)
                retrieve(node.subnode3, item, resultArray);

            if (mask & 16)
                retrieve(node.subnode4, item, resultArray);

            if (mask & 32)
                retrieve(node.subnode5, item, resultArray);

            if (mask & 64)
                retrieve(node.subnode6, item, resultArray);

            if (mask & 128)
                retrieve(node.subnode7, item, resultArray);

        } else {
            var items = node.items,
                itemsLen = items.length,
                resultItem, i;

            for (i = 0; i < itemsLen; i++) {
                resultItem = items[i];

                if (resultItem === item)
                    continue;

                resultItem.flag = 1;
                resultArray.push(resultItem.id);
                //resultArray[resultArray.count++] = resultItem.id;
            }
        }
    }

    /**
     * @param node
     * @param index Index of subnode where the current node will be placed
     * @constructor
     */
    var grow = function (tree, node, index) {
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

    var shrink = function (tree, node) {
        if (node.parent === null && node.nodesCount === 1) {
            var childNode = node[indexToKey[bitIndex[node.nodesMask]]];
            childNode.parent.depth = -1;
            updateDepth(tree, childNode);
            childNode.parent = null;
            return childNode;
        } else
            return false;
    }

    var updateDepth = function (tree, node) {
        node.depth = node.parent.depth + 1;

        if (node.type === Node.BRANCH) {
            if (node.depth > tree.maxDepth)
                merge(tree, node);
            else {
                var nodesMask = node.nodesMask;

                if (nodesMask & 1)
                    updateDepth(tree, node.subnode0);

                if (nodesMask & 2)
                    updateDepth(tree, node.subnode1);

                if (nodesMask & 4)
                    updateDepth(tree, node.subnode2);

                if (nodesMask & 8)
                    updateDepth(tree, node.subnode3);

                if (nodesMask & 16)
                    updateDepth(tree, node.subnode4);

                if (nodesMask & 32)
                    updateDepth(tree, node.subnode5);

                if (nodesMask & 64)
                    updateDepth(tree, node.subnode6);

                if (nodesMask & 128)
                    updateDepth(tree, node.subnode7);
            }
        }
    }

    Node.insert = insert;
    Node.remove = remove;
    Node.retrieve = retrieve;
    Node.grow = grow;
    Node.shrink = shrink;

    return Node;
})