import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./components');
files.push('./App.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace rounded-full with rounded-none
  let newContent = content.replace(/rounded-full/g, 'rounded-none');
  
  // Revert for w-X h-X rounded-none (avatars/icons)
  newContent = newContent.replace(/(w-\d+ h-\d+[^"']*)rounded-none/g, '$1rounded-full');
  newContent = newContent.replace(/rounded-none([^"']*w-\d+ h-\d+)/g, 'rounded-full$1');
  
  // Revert for specific classes like p-2 rounded-none (icon buttons)
  newContent = newContent.replace(/(p-[123][^"']*)rounded-none/g, '$1rounded-full');
  newContent = newContent.replace(/rounded-none([^"']*p-[123])/g, 'rounded-full$1');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated', file);
  }
});
