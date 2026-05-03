const generateQuery = (depth) => {
  let query = `... on Blob { text }\n`;
  for (let i = 0; i < depth; i++) {
    query = `... on Tree { entries { name type object { ${query} } } }\n`;
  }
  return `query { repository(owner: "MonteLogic", name: "MoL-blog-content") { object(expression: "main:posts") { ${query} } } }`;
};
console.log(generateQuery(5));
