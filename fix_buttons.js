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
  let newContent = content.replace(/rounded-full/g, function(match, offset, string) {
    // Check if the surrounding class string contains px- and py- or h-14/12
    let start = string.lastIndexOf('className="', offset);
    if (start === -1) start = string.lastIndexOf('className={`', offset);
    if (start === -1) return match;
    
    let end = string.indexOf('"', offset);
    if (end === -1) end = string.indexOf('`', offset);
    if (end === -1) return match;
    
    let classStr = string.substring(start, end);
    if (classStr.includes('px-') || classStr.includes('py-') || classStr.includes('h-14') || classStr.includes('h-12') || classStr.includes('h-10')) {
      // If it's an avatar (w-10 h-10 or w-8 h-8 or w-12 h-12), keep it full
      if (classStr.match(/w-\d+\s+h-\d+/) && !classStr.includes('px-')) {
        return 'rounded-full';
      }
      return 'rounded-none';
    }
    return match;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated', file);
  }
});
