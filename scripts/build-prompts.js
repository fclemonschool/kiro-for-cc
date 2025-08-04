#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 보안 상수
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 1000;
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9._/\\-]+$/;

// 경로 보안 검증
function validatePath(filePath) {
  const normalizedPath = path.normalize(filePath);
  
  // null bytes, path traversal 공격 방지
  if (normalizedPath.includes('\0') || normalizedPath.includes('..')) {
    throw new Error(`Invalid path detected: ${filePath}`);
  }
  
  // 안전한 문자만 허용
  if (!SAFE_PATH_PATTERN.test(normalizedPath)) {
    throw new Error(`Unsafe characters in path: ${filePath}`);
  }
  
  return normalizedPath;
}

// 파일 크기 검증
function validateFileSize(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${filePath} (${stats.size} bytes)`);
  }
  return stats.size;
}

// 递归查找所有 .md 文件 (보안 강화)
function findMarkdownFiles(dir) {
  const files = [];
  let fileCount = 0;
  
  function walk(currentDir) {
    // 디렉토리 경로 검증
    const validatedDir = validatePath(currentDir);
    
    const entries = fs.readdirSync(validatedDir);
    
    for (const entry of entries) {
      // 파일 수 제한
      if (fileCount >= MAX_FILES) {
        console.warn(`Warning: Maximum file limit (${MAX_FILES}) reached`);
        return;
      }
      
      // 파일명 검증
      const validatedEntry = validatePath(entry);
      const fullPath = path.join(validatedDir, validatedEntry);
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (validatedEntry.endsWith('.md')) {
        // 파일 크기 검증
        try {
          validateFileSize(fullPath);
          files.push(fullPath);
          fileCount++;
        } catch (error) {
          console.warn(`Skipping file: ${error.message}`);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

// 将 Markdown 文件转换为 TypeScript 模块
function convertMarkdownToTypeScript(mdPath, outputDir) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const { data, content: body } = matter(content);
  
  // 生成 TypeScript 代码
  const tsContent = `// Auto-generated from ${path.relative(process.cwd(), mdPath)}
// DO NOT EDIT MANUALLY

export const frontmatter = ${JSON.stringify(data, null, 2)};

export const content = ${JSON.stringify(body)};

export default {
  frontmatter,
  content
};
`;
  
  // 计算输出路径 - 保持相对目录结构
  const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
  const relativePath = path.relative(promptsDir, mdPath);
  const tsFileName = relativePath.replace(/\.md$/, '.ts');
  const tsPath = path.join(outputDir, tsFileName);
  
  // 确保输出目录存在
  const tsDir = path.dirname(tsPath);
  if (!fs.existsSync(tsDir)) {
    fs.mkdirSync(tsDir, { recursive: true });
  }
  
  // 写入文件
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Generated: ${path.relative(process.cwd(), tsPath)}`);
}

// 主函数
function main() {
  const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
  const outputDir = path.join(__dirname, '..', 'src', 'prompts', 'target');
  
  // 确保目录存在
  if (!fs.existsSync(promptsDir)) {
    console.log('Creating prompts directory...');
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    console.log('Creating prompts target directory...');
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 查找并转换所有 Markdown 文件
  const mdFiles = findMarkdownFiles(promptsDir);
  
  if (mdFiles.length === 0) {
    console.log('No markdown files found in', promptsDir);
    return;
  }
  
  console.log(`Converting ${mdFiles.length} markdown files...`);
  mdFiles.forEach(mdFile => convertMarkdownToTypeScript(mdFile, outputDir));
  
  console.log('Build complete!');
}

// 运行
main();