import fs from 'fs/promises';

// Read files
const [template, json] = await Promise.all([
  fs.readFile('template.html', 'utf-8'),
  fs.readFile('gamePagesWithEngine.json', 'utf-8')
]);

// Prepare data: inject the parsed JSON as a JS array, not a string
const parsed = JSON.parse(json);
// Use JSON.stringify with no spacing for compact, or 2 for readable:
const asJS = JSON.stringify(parsed, null, 2);

const result = template.replace(
  '"###GAME_DATA###";',
  `${asJS};`
);

// Write result
await fs.writeFile('enginePieChart.html', result, 'utf-8');
console.log('enginePieChart.html generated!');
