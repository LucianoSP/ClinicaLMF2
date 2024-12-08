import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { PATHS, ensureDirectories } from '@/lib/config';

export async function POST(request: Request) {
  try {
    ensureDirectories();
    
    const formData = await request.formData();
    const files = formData.getAll('files');

    const savedFiles = await Promise.all(
      files.map(async (file: any) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const filePath = path.join(PATHS.PDF_UPLOAD, file.name);
        await writeFile(filePath, buffer);
        return file.name;
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Arquivos enviados com sucesso',
      files: savedFiles 
    });
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar arquivos' },
      { status: 500 }
    );
  }
}
