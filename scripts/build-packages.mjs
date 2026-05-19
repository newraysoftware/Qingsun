import { cpSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packagesDir = join(root, 'packages')

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit' })
}

console.log('>>> 构建前端...')
run('npm run build')

console.log('>>> 构建后端...')
run('npm run build', join(root, 'server'))

rmSync(packagesDir, { recursive: true, force: true })
mkdirSync(packagesDir, { recursive: true })

const frontendPkg = join(packagesDir, 'frontend')
const serverPkg = join(packagesDir, 'server')

cpSync(join(root, 'dist'), frontendPkg, { recursive: true })

mkdirSync(serverPkg, { recursive: true })
cpSync(join(root, 'server', 'dist'), join(serverPkg, 'dist'), { recursive: true })
cpSync(join(root, 'server', 'package.json'), join(serverPkg, 'package.json'))
cpSync(join(root, 'server', '.env.example'), join(serverPkg, '.env.example'))
writeFileSync(
  join(serverPkg, 'README.md'),
  `# 青笋后端安装包\n\n\`\`\`bash\ncp .env.example .env\nnpm install --omit=dev\nnode dist/index.js\n\`\`\`\n`,
)

const isMac = process.platform === 'darwin'
if (isMac) {
  run(`zip -r qingsun-frontend.zip frontend`, packagesDir)
  run(`zip -r qingsun-server.zip server`, packagesDir)
} else {
  console.log('跳过 zip（非 macOS，可手动打包 packages/frontend 与 packages/server）')
}

console.log('>>> 安装包已生成至 packages/')
