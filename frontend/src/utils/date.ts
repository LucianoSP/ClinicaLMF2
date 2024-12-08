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
    
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    return dateStr;
  }
}
