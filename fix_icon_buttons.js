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
    // Check if the surrounding class string contains button or similar
    let start = string.lastIndexOf('<', offset);
    if (start === -1) return match;
    
    let tagStr = string.substring(start, offset);
    if (tagStr.includes('<button') || tagStr.includes('w-10 h-10') || tagStr.includes('w-12 h-12') || tagStr.includes('w-8 h-8') || tagStr.includes('p-2') || tagStr.includes('p-3') || tagStr.includes('p-1.5')) {
      // Keep it full if it's an avatar or color dot or spinner
      if (tagStr.includes('avatar') || tagStr.includes('w-2 h-2') || tagStr.includes('w-4 h-4') || tagStr.includes('w-5 h-5') || tagStr.includes('w-6 h-6')) {
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
