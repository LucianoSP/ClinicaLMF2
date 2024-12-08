import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const resultsDir = path.join(process.cwd(), '..', 'resultados');
    
    // Verifica se o diretório existe
    if (!existsSync(resultsDir)) {
      return NextResponse.json({ success: true, files: [] });
    }

    // Lê todos os arquivos .md do diretório
    const mdFiles = readdirSync(resultsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(resultsDir, file));

    if (mdFiles.length === 0) {
      return NextResponse.json({ success: true, files: [] });
    }

    // Lê o conteúdo do arquivo mais recente
    const content = await readFile(mdFiles[mdFiles.length - 1], 'utf-8');
    
    // Extrai as informações do markdown
    const lines = content.split('\n');
    const files = [];
    
    let currentData = {
      clinica: '',
      profissional: '',
      conselho: '',
      data: '',
      assinatura: ''
    };

    // Extrai informações do cabeçalho
    for (const line of lines) {
      if (line.includes('CLINICA')) {
        currentData.clinica = line.split(':')[1].trim();
      } else if (line.includes('Profissional')) {
        currentData.profissional = line.split(':')[1].trim();
      } else if (line.includes('Conselho')) {
        currentData.conselho = line.split(':')[1].trim();
      } else if (line.startsWith('**Data:**')) {
        currentData.data = line.split(':')[1].trim();
      } else if (line.includes('Assinatura do Contratado')) {
        currentData.assinatura = line.split(':')[1].trim();
      }
    }

    // Encontra a tabela
    const tableStart = lines.findIndex(line => line.includes('| Data | Carteira |'));
    if (tableStart !== -1) {
      // Pula o cabeçalho e a linha de separação
      const tableData = lines.slice(tableStart + 2);
      
      for (const line of tableData) {
        if (line.startsWith('|') && line.includes('|')) {
          const [, data, carteira, nome, guia, assinatura] = line.split('|').map(cell => cell.trim());
          if (carteira && nome) { // Verifica se tem dados válidos
            files.push({
              filename: `Guia_${guia}.pdf`,
              data: {
                data: data || currentData.data,
                carteira,
                nome,
                guia,
                clinica: currentData.clinica,
                profissional: currentData.profissional,
                conselho: currentData.conselho,
                assinatura: assinatura === '✓' ? 'Sim' : 'Não'
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Erro ao ler arquivos processados:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao ler arquivos processados' },
      { status: 500 }
    );
  }
}
