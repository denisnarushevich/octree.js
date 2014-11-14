# Octree
> JavaScript Octree / Quadtree implementation, with focus on performance

There is still an areas of possible performance improvement.

Octree can also be used as quadtree, just drop Z values.

## Features
* Maximally bitwise
* Supports AABB and POINT
* Without dependencies
* UMD

## Usage
Just inherit your object from Octree.Item and insert it into octree instance.

```js
...
var octree = new Octree();
var item = new Octree.Item(x,y,z,ex,ey,ez); //ex,ey,ez is required only for AABB item
octree.insert(item);
var items = [];
octree.retrieve(item, items); //retrieve items from octant of provided item
```