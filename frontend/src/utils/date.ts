export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  
  // Se a data já estiver no formato DD/MM/YYYY, retorna ela mesma
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateStr;
  }
}
