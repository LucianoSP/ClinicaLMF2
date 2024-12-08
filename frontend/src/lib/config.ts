import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Caminhos importantes da aplicação
export const PATHS = {
  PDF_UPLOAD: path.join(process.cwd(), '..', 'pdfs_origem'),
  RESULTS_DIR: path.join(process.cwd(), '..', 'resultados')
};

// Garante que as pastas necessárias existam
export function ensureDirectories() {
  if (!existsSync(PATHS.PDF_UPLOAD)) {
    mkdirSync(PATHS.PDF_UPLOAD, { recursive: true });
  }
  if (!existsSync(PATHS.RESULTS_DIR)) {
    mkdirSync(PATHS.RESULTS_DIR, { recursive: true });
  }
}
