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

p.x = 0;
p.y = 0;
p.z = 0;

p.ex = 0;
p.ey = 0;
p.ez = 0;

module.exports = Item;