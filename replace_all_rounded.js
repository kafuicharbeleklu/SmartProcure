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
  let newContent = content.replace(/rounded-(xl|2xl|3xl|lg|md|sm|t-xl|b-xl|l-xl|r-xl|tl-xl|tr-xl|bl-xl|br-xl|t-lg|b-lg|l-lg|r-lg|tl-lg|tr-lg|bl-lg|br-lg|t-md|b-md|l-md|r-md|tl-md|tr-md|bl-md|br-md|t-sm|b-sm|l-sm|r-sm|tl-sm|tr-sm|bl-sm|br-sm)/g, 'rounded-none');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated', file);
  }
});
