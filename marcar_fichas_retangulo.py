import os
import cv2
import pymupdf
from PIL import Image
import numpy as np

def pdf_to_images(pdf_path, output_folder, dpi=300):
    # Abrir o PDF
    doc = pymupdf.open(pdf_path)

    # Converter cada página em uma imagem
    for page_number in range(len(doc)):
        page = doc[page_number]
        pix = page.get_pixmap(dpi=dpi)
        
        # Salvar a imagem
        output_path = f"{output_folder}/page_{page_number + 1}.png"
        pix.save(output_path)
        print(f"Página {page_number + 1} salva em {output_path}")

    doc.close()




# Função para processar um PDF e aplicar o script de marcação
def process_pdf(input_pdf_path, output_pdf_path):
    # Abrir o PDF
    doc = pymupdf.open(input_pdf_path)
    processed_images = []

    for page_num, page in enumerate(doc):
        # Extrair a imagem da página
        pix = page.get_pixmap(dpi=300)
        image = cv2.cvtColor(
            np.array(Image.frombytes("RGB", [pix.width, pix.height], pix.samples)),
            cv2.COLOR_RGB2BGR
        )

        # Aplicar o script de marcação
        # Lista de coordenadas dos retângulos e seus rótulos com cores
        rectangles = [
            (2850, 325, 315, 85, "    1. FICHA  "),
            (280, 815, 405, 1350, "    2. DATA  "),
            (760, 855, 600, 1320, "     3. CARTEIRA        "),
            (1390, 855, 720, 1320, " 4. BENEFICIARIO           "),
            (2170, 855, 550, 1320, " 5. NUMERO GUIA"),
            (2800, 855, 460, 1320, "  6. ASSINATURA "),
        ]

        # Retângulos de fundo opaco
        cv2.rectangle(image, (1, 1), (2830, 760), (255, 255, 255), -1)
        cv2.rectangle(image, (2775, 480), (3335, 755), (255, 255, 255), -1)

        # Cor das caixas e textos
        box_color = (0, 0, 255)  # Vermelho
        text_color = (0, 0, 255)  # Vermelho
        text_bg_color = (255, 255, 255)  # Branco

        for rect in rectangles:
            x, y, w, h, label = rect
            cv2.rectangle(image, (x, y), (x + w, y + h), box_color, 5)

            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 4, 2)[0]
            text_width, text_height = text_size[0], text_size[1]
            padding = 5
            text_bg_x1, text_bg_y1 = x + 0, y - text_height - 20 - padding
            text_bg_x2, text_bg_y2 = x + 30 + text_width + 20, y - 5 + padding

            cv2.rectangle(image, (text_bg_x1, text_bg_y1), (text_bg_x2, text_bg_y2), text_bg_color, -1)
            cv2.putText(image, label, (text_bg_x1 + 0, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, text_color, 2)

        # Adicionar a imagem processada à lista
        processed_images.append(Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB)))

    # Salvar as imagens processadas como PDF
    processed_images[0].save(output_pdf_path, "PDF", save_all=True, append_images=processed_images[1:])

# Função principal para processar todos os PDFs em uma pasta
def process_pdfs_in_folder(input_folder, output_folder):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    for filename in os.listdir(input_folder):
        if filename.endswith(".pdf"):
            input_pdf_path = os.path.join(input_folder, filename)
            output_pdf_path = os.path.join(output_folder, filename)

            print(f"Processando: {input_pdf_path} -> {output_pdf_path}")
            process_pdf(input_pdf_path, output_pdf_path)

# Configurações de pastas
input_folder = "guias_novas"
output_folder = "guias_processadas"

# Executar o processamento
process_pdfs_in_folder(input_folder, output_folder)

# Exemplo de uso
#pdf_path = "guias_novas"
#output_folder = "guias_processadas_imagens"
#pdf_to_images(pdf_path, output_folder)

print("Todos os PDFs foram processados e salvos na pasta destino.")
