const db = require('./module/utils/pool');

var json = require('./creators.json');

// json.forEach(async creator => {
//     const name = creator.name;
//     const category_idx = creator.category_idx;

//     const insertCreatorCategoryQuery = "INSERT INTO creator_category(creator_idx, category_idx) VALUES((SELECT idx FROM creator WHERE name = ?), ?)";
//     const insertCreatorCategoryResult = await db.queryParam_Parse(insertCreatorCategoryQuery, [name, category_idx]);
// });

// json.forEach(async creator => {
//     const creator_idx = creator.creator_idx;
//     const category_idx = creator.category_idx;

//     const insertCreatorCategoryQuery = "UPDATE creator_category SET category_idx = ? WHERE creator_idx = ?";
//     const insertCreatorCategoryResult = await db.queryParam_Parse(insertCreatorCategoryQuery, [category_idx, creator_idx]);
// });


// let nameList = "";

// json.forEach(async creator => {
//     const name = creator.name;
//     nameList += "\"" + name +"\","
// });
// nameList = nameList.slice(0, nameList.length-1);

// console.log(nameList)
// const deleteCreatorCategoryQuery = `DELETE FROM creator WHERE name NOT IN(${nameList});`;
// const deleteCreatorCategoryResult = db.queryParam_None(deleteCreatorCategoryQuery);