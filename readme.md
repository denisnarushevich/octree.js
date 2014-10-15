# Octree.js
> JavaScript Octree / Quadtree implementation, with focus on performance

I couldn't find any fast & reusable octree or quadtree implementation that wouldn't be tied to some gameEngine,
that's why I tried to create my own octree. I've tried doing it maximally bitwise & with minimal loop usage.

It's pretty fast on insert/remove, but it depends from machine.
Still it's not recommended to rebuild tree on each frame.
Retrieval of items doesn't use expensive functions, all the cost comes from recursion + insertion of ints in array, 
so it's pretty fast to use it each frame, usually it's <1ms.

> There is still an areas of possible improvement, like retrieving.

## Features
* Maximally bitwise
* Minimal loop usage
* Supports AABB and POINT
* Universal and independent

## Integration
In order to integrate the octree in you code you should create a structure that maps octree items with your system items.
Octree won't create item instances for you. Your integration may look something like this:

```
var itemGameObjects = {};
var octree = new Octree();

//...

function insertGameObjectInOctree(gameObject){
  var item = new Octree.Item(gameObject.x, gameObject.y, gameObject.z);
  itemGameObject[item.id] = gameObject;
  octree.insert(item);
}

function getGameObjectNeighboursFromOctree(gameObject){
  var r = octree.retrieve(gameObject);
  
  for(var i = 0; i < r.length; i++){
    r[i] = this.itemGameObject[r[i].id];
  }
  
  return r;
}
```

There is one for loop, but until there is not much items it won't matter, it will happen only once.

The replacement of item element with gameObject should be fast, because you are indexing already allocated array elements, so there shoudn't be any memory management in the background.

Faster way would be to edit Octree.Item class by adding gameObject property, then you can get rid off the loop. But then you'll have to call to item.gameObject property.

```
function insertGameObjectInOctree(gameObject){
  var item = new Octree.Item(gameObject.x, gameObject.y, gameObject.z);
  item.gameObject = gameObject;
  octree.insert(item);
}

function getGameObjectNeighboursFromOctree(gameObject){
  var r = octree.retrieve(gameObject);
  
  return r;
}
```