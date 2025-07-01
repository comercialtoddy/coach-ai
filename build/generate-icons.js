const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Criar ícone base SVG simples para Coach-AI
const createBaseSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7931e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="35%" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" text-anchor="middle" fill="white">CA</text>
  <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="${size * 0.12}" text-anchor="middle" fill="white">CS2</text>
</svg>`;

const iconSizes = {
  // Windows ICO - múltiplos tamanhos
  windows: [16, 24, 32, 48, 64, 128, 256],
  // macOS ICNS - tamanhos padrão
  macos: [16, 32, 128, 256, 512, 1024],
  // Linux PNG - tamanhos comuns
  linux: [16, 24, 32, 48, 64, 128, 256, 512]
};

async function generateIcons() {
  console.log('🎨 Gerando ícones para Coach-AI...');
  
  try {
    // Criar diretório se não existir
    const iconsDir = path.join(__dirname, 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    // Gerar ícones base em PNG
    console.log('📝 Criando ícones PNG base...');
    for (const size of [16, 32, 48, 64, 128, 256, 512, 1024]) {
      const svgBuffer = Buffer.from(createBaseSVG(size));
      await sharp(svgBuffer)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`✅ Criado: icon-${size}x${size}.png`);
    }

    // Criar ícone principal para cada plataforma
    console.log('🪟 Criando ícone Windows (.ico)...');
    const windowsSizes = [16, 24, 32, 48, 64, 128, 256];
    for (const size of windowsSizes) {
      const svgBuffer = Buffer.from(createBaseSVG(size));
      await sharp(svgBuffer)
        .png()
        .toFile(path.join(iconsDir, `win-${size}.png`));
    }
    
    // Criar ícone principal de 256px para Windows
    const svgBuffer256 = Buffer.from(createBaseSVG(256));
    await sharp(svgBuffer256)
      .png()
      .toFile(path.join(iconsDir, 'icon.png'));
    
    console.log('🍎 Criando ícone macOS (.icns)...');
    // Para macOS, vamos criar o ícone principal em 1024px
    const svgBuffer1024 = Buffer.from(createBaseSVG(1024));
    await sharp(svgBuffer1024)
      .png()
      .toFile(path.join(iconsDir, 'icon.icns.png'));
    
    console.log('🐧 Criando ícone Linux (.png)...');
    // Para Linux, criar ícone de 512px
    const svgBuffer512 = Buffer.from(createBaseSVG(512));
    await sharp(svgBuffer512)
      .png()
      .toFile(path.join(iconsDir, 'icon-linux.png'));

    // Criar favicon também
    console.log('🌐 Criando favicon...');
    const svgBuffer32 = Buffer.from(createBaseSVG(32));
    await sharp(svgBuffer32)
      .png()
      .toFile(path.join(iconsDir, 'favicon.png'));

    console.log('🎯 Todos os ícones foram gerados com sucesso!');
    console.log('📂 Localização:', iconsDir);
    
    // Listar arquivos gerados
    const files = fs.readdirSync(iconsDir);
    console.log('📋 Arquivos gerados:');
    files.forEach(file => console.log(`   - ${file}`));

  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, createBaseSVG }; 