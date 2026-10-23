const test=require('node:test');
const assert=require('node:assert/strict');
const {treemap}=require('../charts.js');
test('treemap areas equal income shares and rectangles never overlap',()=>{
 for(const values of [[128350.7,30449.3,17000,4800],[1,1,1,1],[999999,1,0,2],[4,20,8,9]]){
  const tiles=treemap(values),sum=values.reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(tiles.reduce((a,t)=>a+t.width*t.height,0)-6500)<1e-8);
  for(const t of tiles){assert.ok(Math.abs(t.width*t.height/6500-values[t.index]/sum)<1e-10);assert.ok(t.x>=0&&t.y>=0&&t.x+t.width<=100+1e-10&&t.y+t.height<=65+1e-10);}
  for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){
   const a=tiles[i],b=tiles[j],w=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),h=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
   assert.ok(w<=1e-10||h<=1e-10,'overlapping rectangles');
  }
 }
});
test('empty, invalid and zero chart values are omitted without changing source indices',()=>{
 assert.deepEqual(treemap([0,0]),[]);assert.deepEqual(treemap([]),[]);assert.deepEqual(treemap([2],0,65),[]);
 const tiles=treemap([0,-1,NaN,10,Infinity]);assert.equal(tiles.length,1);assert.equal(tiles[0].index,3);assert.equal(tiles[0].width,100);assert.equal(tiles[0].height,65);
});
